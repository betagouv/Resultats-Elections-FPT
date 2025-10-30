export default async function (eleventyConfig) {
  eleventyConfig.setInputDirectory('src/views')
  eleventyConfig.setOutputDirectory('site')
  eleventyConfig.setLayoutsDirectory('../layouts')
  eleventyConfig.addPassthroughCopy({ 'src/scripts': 'scripts' })
  eleventyConfig.addPassthroughCopy({ 'src/styles': 'styles' })
}
