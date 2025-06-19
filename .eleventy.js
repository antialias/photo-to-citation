const { config } = require("./src/lib/config");

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("website/style.css");
  eleventyConfig.addPassthroughCopy("website/images");
  return {
    pathPrefix: config.PATH_PREFIX || "/",
    dir: {
      input: "website",
      output: "website/dist",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
  };
};
