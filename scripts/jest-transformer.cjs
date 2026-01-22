/* eslint-disable */
const { TsJestTransformer } = require('ts-jest');

const transformer = new TsJestTransformer();

module.exports = {
    ...transformer,
    process(sourceText, sourcePath, options) {
        // Replace import.meta with globalThis.importMeta
        const fixedContent = sourceText.replace(/import\.meta/g, 'globalThis.importMeta');
        return transformer.process(fixedContent, sourcePath, options);
    },
};
