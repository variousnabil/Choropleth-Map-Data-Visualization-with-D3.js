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
    .attr('viewBox', [0, 0, w, h]);

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

const getEducationData = axios.get(urlEducationData);
const getCountyData = axios.get(urlCountyData);

Promise.all([getEducationData, getCountyData])
    .then(results => {
        const educationData = results[0].data;
        const countyData = results[1].data;
        console.log('educationData', educationData);
        console.log('countyData', countyData);

        // education data simplified only 'id' and 'bachelorsOrHigher' data.
        const data = {};
        educationData.forEach(item => {
            data[item.fips] = item['bachelorsOrHigher'];
        });
        console.log(data);

        const colorScale = d3.scaleQuantize([3, 75], d3.schemeGreens[8]);
        const path = d3.geoPath();

        const US_MAP = svg.append('g')
            .attr('id', 'USMAP')
            .attr('width', w - margin.left - margin.right)
            .attr('height', 600)
            .attr('x', margin.left)
            .attr('y', margin.top * 5);

        // county path
        US_MAP.append('g')
            .selectAll('path')
            .data(topojson.feature(countyData, countyData.objects.counties).features)
            .join('path')
            .attr('class', 'county')
            .attr('fill', d => colorScale(data[d.id]))
            .attr('d', path);

        // state path
        US_MAP.append('path')
            .datum(topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b))
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-linejoin', 'round')
            .attr('d', path);

    });
