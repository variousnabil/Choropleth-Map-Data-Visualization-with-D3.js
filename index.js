const urlEducationData = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const urlCountyData = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

const w = 1000;
const h = 600;

const margin = {
    top: 36,
    right: 32,
    bottom: 36,
    left: 32
}

const svg = d3.select('.container')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

svg.append('text')
    .attr('x', w / 2)
    .attr('y', margin.top * 1.5)
    .attr('text-anchor', 'middle')
    .attr('id', 'title')
    .style('font-size', '2em')
    .style('font-weight', 'bold')
    .text('United States Educational Attainment');

svg.append('text')
    .attr('x', w / 2)
    .attr('y', margin.top * 2.5)
    .attr('text-anchor', 'middle')
    .attr('id', 'description')
    .style('font-size', '1em')
    .text(`Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)`);
