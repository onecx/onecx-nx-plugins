import { parse, stringify } from 'yaml';

export const COMMENT_KEY = '~comment~';

interface OpenAPIRoute {
  path: string;
  component: string;
  pathMatch: string;
}

export class OpenAPIUtil {
  private yamlContent: object;

  constructor(yamlContent: string) {
    this.yamlContent = parse(yamlContent);
  }

  routes(): OpenAPIArraySectionUtil<OpenAPIRoute> {
    if (!this.yamlContent['routes']) {
      this.yamlContent['routes'] = {};
    }
    return new OpenAPIArraySectionUtil(this, this.yamlContent['routes']);
  }

  paths(): OpenAPIObjectSectionUtil {
    if (!this.yamlContent['paths']) {
      this.yamlContent['paths'] = {};
    }
    return new OpenAPIObjectSectionUtil(this, this.yamlContent['paths']);
  }

  schemas(): OpenAPIObjectSectionUtil {
    if (!this.yamlContent['components']) {
      this.yamlContent['components'] = {};
    }
    if (!this.yamlContent['components']['schemas']) {
      this.yamlContent['components']['schemas'] = {};
    }
    return new OpenAPIObjectSectionUtil(this, this.yamlContent['components']['schemas']);
  }

  finalize(): string {
    let asString = stringify(this.yamlContent);
    // Replace comments
    asString = asString.replaceAll(`~comment~:`, '#');
    return asString;
  }
}

export class OpenAPIObjectSectionUtil {
  private util: OpenAPIUtil;
  private sectionContent: object;

  constructor(util: OpenAPIUtil, sectionContent: object) {
    this.util = util;
    this.sectionContent = sectionContent;
  }

  set(key: string, value: object, comment?: string, forceReplace = false) {
    if (this.sectionContent[key] != null && !forceReplace) return this;
    this.sectionContent[key] = value;
    if (comment) {
      this.sectionContent[key][COMMENT_KEY] = comment;
    }
    return this;
  }

  done() {
    return this.util;
  }
}

export class OpenAPIArraySectionUtil<T = unknown> {
  private util: OpenAPIUtil;
  private sectionContent: unknown[];

  constructor(util: OpenAPIUtil, sectionContent: unknown[]) {
    this.util = util;
    this.sectionContent = sectionContent;
  }

  add(value: T) {
    this.sectionContent.push(value);
    return this;
  }

  done() {
    return this.util;
  }
}
