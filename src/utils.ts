import fs from 'fs';

import { Config } from './types/Config';
import { getRule } from './rules/registry';
import { DefaultConfig } from './defaultConfig';

const mergeConfigs = (parentConfig:Config, childConfig:Config):Config => {
  const mergedRules = { ...parentConfig.rules, ...childConfig.rules };
  const config = <Config>{ ...parentConfig, ...childConfig };
  config.rules = mergedRules;
  return config;
};


const validateConfig = (config: Config):void => {
  if (config.rules) {
    for (const ruleName in config.rules) {
      if (Object.prototype.hasOwnProperty.call(config.rules, ruleName)) {
        const rule = getRule(ruleName);
        if (!rule) {
          throw new Error(`Rule '${ruleName}' is not valid`);
        }
      }
    }
  }
};

const loadBaseConfig = (baseDir:string, configFile:string|null):Config => {

  let cfile = configFile;
  if (cfile == null) {
    cfile = '.monolinter.json';
  }

  if (fs.existsSync(`${baseDir}/${cfile}`)) {
    const cf = fs.readFileSync(`${baseDir}/${cfile}`);
    const loadedConfig = JSON.parse(cf.toString());
    // eslint-disable-next-line no-prototype-builtins
    if (!loadedConfig.hasOwnProperty('defaults') || loadedConfig.defaults) {
      return mergeConfigs(<Config>DefaultConfig, loadedConfig);
    }
    return loadedConfig;
  }

  if (cfile === '.monolinter.json') {
    console.info(`File "${configFile}" not found. Using default configurations`);
    return <Config>DefaultConfig;
  }

  throw new Error(`File "${configFile}" not found`);
};

const loadIgnorePatterns = (baseDir:string):string[] => {
  const cfile = `${baseDir}/.monolinterignore`;
  if (fs.existsSync(cfile)) {
    const cf = fs.readFileSync(cfile);
    const ignorePatterns = cf.toString().trim().split("\n");
    const fi = ignorePatterns.filter((elem) => {
      return elem.trim().length > 0 && !elem.trim().startsWith('#');
    });
    const fi2 = fi.map((elem) => {
      return `${baseDir}/${elem}`;
    });
    return fi2;
  }
  return [];
};

export { mergeConfigs, validateConfig, loadBaseConfig, loadIgnorePatterns };
