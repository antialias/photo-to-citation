module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("website/style.css");
  return {
    dir: {
      input: "website",
      output: "website/dist",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
  };
};
