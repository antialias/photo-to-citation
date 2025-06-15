module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("website/style.css");
  eleventyConfig.addPassthroughCopy("website/images");
  return {
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: {
      input: "website",
      output: "website/dist",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
  };
};
