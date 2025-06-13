module.exports = (eleventyConfig) => ({
  dir: {
    input: "website",
    output: "website/dist",
  },
  markdownTemplateEngine: "liquid",
  htmlTemplateEngine: "liquid",
  dataTemplateEngine: "liquid",
});
