import * as babel from "@babel/standalone";

export default async function transformCode(
  inputCode,
  babelOptions,
  overrides,
  customOptions,
  ctx,
  finalizeOptions
) {
  let config;

  if (!babel.loadPartialConfigAsync && !babel.loadPartialConfig) {
    const getPresets = (optionPresets) => {
      const presets = [];
      optionPresets.forEach((p) => {
        if (Array.isArray(p)) {
          presets.push([babel.availablePresets[p[0]], p[1]]);
        } else {
          presets.push(babel.availablePresets[p]);
        }
      });
      return presets;
    };
    config = {
      options: {
        plugins: babelOptions.plugins,
        presets: getPresets(babelOptions.presets), // babelOptions.presets.map((p) => babel.availablePresets[p]),
      },
    };
  } else {
    // loadPartialConfigAsync has become available in @babel/core@7.8.0
    config = await (babel.loadPartialConfigAsync || babel.loadPartialConfig)(
      babelOptions
    );
  }

  // file is ignored by babel
  if (!config) {
    return null;
  }

  let transformOptions = !overrides.config
    ? config.options
    : await overrides.config.call(this, config, {
        code: inputCode,
        customOptions,
      });

  if (finalizeOptions) {
    transformOptions = await finalizeOptions(transformOptions);
  }

  if (!overrides.result) {
    const { code, map } = await babel.transform(inputCode, transformOptions);
    return {
      code,
      map,
    };
  }

  const result = await babel.transform(inputCode, transformOptions);
  const { code, map } = await overrides.result.call(ctx, result, {
    code: inputCode,
    customOptions,
    config,
    transformOptions,
  });
  return {
    code,
    map,
  };
}
