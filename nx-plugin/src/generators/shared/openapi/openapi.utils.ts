import { parse, stringify } from 'yaml';
export const COMMENT_KEY = '~comment~';

interface OpenAPIRoute {
  path: string;
  component: string;
  pathMatch: string;
}

/**
 * This utility can be used to adapt OpenAPI YAML Files
 * It provides are builder-like interface to interact and bases
 * on the YAML library to parse / stringify.
 * When you want to add a comment to your JSON, you can do so by using an
 * object with the COMMENT_KEY as key. Though be aware, once this utility
 * parses the OpenAPI again, all previous comments will be lost (as JSON
 * does not have comments).
 */
export class OpenAPIUtil {
  private yamlContent: object;

  constructor(yamlContent: string) {
    this.yamlContent = parse(yamlContent);
  }

  /**
   * Quick access to the routes section of the YAML
   * @returns interface to add items to the section
   */
  routes(): OpenAPIArraySectionUtil<OpenAPIRoute> {
    if (!this.yamlContent['routes']) {
      this.yamlContent['routes'] = {};
    }
    return new OpenAPIArraySectionUtil(this, this.yamlContent['routes']);
  }

  /**
   * Quick access to the paths section of the YAML
   * @returns interface to set items of the section
   */
  paths(): OpenAPIObjectSectionUtil {
    if (!this.yamlContent['paths']) {
      this.yamlContent['paths'] = {};
    }
    return new OpenAPIObjectSectionUtil(this, this.yamlContent['paths']);
  }

  /**
   * Quick access to the schemas section of the YAML
   * @returns interface to set items of the section
   */
  schemas(): OpenAPIObjectSectionUtil {
    if (!this.yamlContent['components']) {
      this.yamlContent['components'] = {};
    }
    if (!this.yamlContent['components']['schemas']) {
      this.yamlContent['components']['schemas'] = {};
    }
    return new OpenAPIObjectSectionUtil(
      this,
      this.yamlContent['components']['schemas']
    );
  }

  /**
   * Access to the full YAML
   * @returns interface to set items of the section
   */
  full(): OpenAPIObjectSectionUtil {
    return new OpenAPIObjectSectionUtil(this, this.yamlContent);
  }

  finalize(): string {
    let asString = stringify(this.yamlContent, {
      lineWidth: 0,
    });
    // Replace comments
    asString = asString.replaceAll(`~comment~:`, '#');
    return asString;
  }
}

export interface ObjectSetOptions {
  // Add a comment after insertion
  comment?: string | undefined;
  // If a value already exists for a key, what action should be performed
  existStrategy: 'skip' | 'replace' | 'extend';
}
export class OpenAPIObjectSectionUtil {
  private util: OpenAPIUtil;
  private sectionContent: object;

  constructor(util: OpenAPIUtil, sectionContent: object) {
    this.util = util;
    this.sectionContent = sectionContent;
  }

  /**
   * Sets an entry of this section content
   * @param key key of the entry object
   * @param value value of the entry object
   * @param comment comment for the entry (added last)
   * @param options configure existStrategy and comment
   * @returns
   */
  set(key: string, value: object, options?: ObjectSetOptions) {
    const existStrategy = options ? options.existStrategy : 'skip';
    if (this.sectionContent[key] != null) {
      if (existStrategy == 'extend') {
        this.sectionContent[key] = {
          ...this.sectionContent[key],
          ...value,
        };
        return this;
      }
      if (existStrategy == 'skip') {
        return this;
      }
      // Replace is same as initial set
    }
    this.sectionContent[key] = value;
    if (options && options.comment) {
      this.sectionContent[key][COMMENT_KEY] = options.comment;
    }
    return this;
  }

  get(key: string) {
    return this.sectionContent[key];
  }

  /**
   * Return to util interface
   * @returns initial util interface
   */
  done() {
    return this.util;
  }
}

export class OpenAPIArraySectionUtil<T = unknown> {
  private util: OpenAPIUtil;
  private sectionContent: T[];

  constructor(util: OpenAPIUtil, sectionContent: T[]) {
    this.util = util;
    this.sectionContent = sectionContent;
  }

  /**
   * Add a new item to the section
   * @param value
   * @returns this util
   */
  add(value: T) {
    this.sectionContent.push(value);
    return this;
  }

  /**
   * Allows to run a manipulator on this section
   * @param manipulator method to invoke with section data, return value is set
   * @returns this util
   */
  manipulate(manipulator: (sectionContent: T[]) => T[]) {
    this.sectionContent = manipulator(this.sectionContent);
    return this;
  }

  /**
   * Return to util interface
   * @returns initial util interface
   */
  done() {
    return this.util;
  }
}
