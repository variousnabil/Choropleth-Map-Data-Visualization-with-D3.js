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
    .attr('viewBox', [0, 0, w, 150]);

svg.append('text')
    .attr('x', w / 2)
    .attr('y', margin.top * 2)
    .attr('text-anchor', 'middle')
    .attr('id', 'title')
    .style('font-size', '2em')
    .style('font-weight', 'bold')
    .text('United States Educational Attainment');

svg.append('text')
    .attr('x', w / 2)
    .attr('y', margin.top * 3.7)
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
            data[item.fips] = {
                state: item['state'],
                area_name: item['area_name'],
                bachelorsOrHigher: item['bachelorsOrHigher']
            };
        });
        console.log('data', data);

        const colorScale = d3.scaleQuantize([3, 75], d3.schemeGreens[9]);

        const path = d3.geoPath();

        const US_MAP = d3.select('.container').append('svg')
            .attr('id', 'USMAP')
            .attr('viewBox', [-145, 0, 1200, 630]);

        // county path
        US_MAP.append('g')
            .selectAll('path')
            .data(topojson.feature(countyData, countyData.objects.counties).features)
            .join('path')
            .attr('class', 'county')
            .attr('id', (d, i) => 'county' + i)
            .attr('data-fips', d => d.id)
            .attr('data-education', d => data[d.id]['bachelorsOrHigher'])
            .attr('fill', d => colorScale(data[d.id]['bachelorsOrHigher']))
            .attr('d', path)
            .on('mouseover', (d, i) => {
                const county = document.querySelector('#county' + i);
                console.log('fips', county.dataset.fips);
                console.log('education', county.dataset.education + '%');

                const tooltip = document.querySelector('#tooltip');
                tooltip.style.opacity = 1;
                console.log(d3.event.pageX)
                tooltip.style.left = d3.event.pageX;
                tooltip.style.top = d3.event.pageY;
                tooltip.textContent = `${data[d.id]['area_name']}, ${data[d.id]['state']}: ${data[d.id]['bachelorsOrHigher']}%`
                tooltip.setAttribute('data-education', data[d.id]['bachelorsOrHigher'])
            })
            .on('mouseout', (d, i) => {
                const tooltip = document.querySelector('#tooltip');
                tooltip.style.opacity = 0;
                tooltip.style.right = 0;
                tooltip.style.top = 0;
            });

        // state path
        US_MAP.append('path')
            .datum(topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b))
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-linejoin', 'round')
            .attr('d', path);

        // legend template from https://observablehq.com/@d3/color-legend 
        function legend({
            color,
            title,
            tickSize = 6,
            width = 320,
            height = 44 + tickSize,
            marginTop = 18,
            marginRight = 0,
            marginBottom = 16 + tickSize,
            marginLeft = 0,
            ticks = width / 64,
            tickFormat,
            tickValues
        } = {}) {

            const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .style("overflow", "visible")
                .style("display", "block")
                .attr('id', 'legend');

            let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
            let x;

            // Continuous
            if (color.interpolate) {
                const n = Math.min(color.domain().length, color.range().length);

                x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

                svg.append("image")
                    .attr("x", marginLeft)
                    .attr("y", marginTop)
                    .attr("width", width - marginLeft - marginRight)
                    .attr("height", height - marginTop - marginBottom)
                    .attr("preserveAspectRatio", "none")
                    .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
            }

            // Sequential
            else if (color.interpolator) {
                x = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
                    { range() { return [marginLeft, width - marginRight]; } });

                svg.append("image")
                    .attr("x", marginLeft)
                    .attr("y", marginTop)
                    .attr("width", width - marginLeft - marginRight)
                    .attr("height", height - marginTop - marginBottom)
                    .attr("preserveAspectRatio", "none")
                    .attr("xlink:href", ramp(color.interpolator()).toDataURL());

                // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
                if (!x.ticks) {
                    if (tickValues === undefined) {
                        const n = Math.round(ticks + 1);
                        tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                    }
                    if (typeof tickFormat !== "function") {
                        tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                    }
                }
            }

            // Threshold
            else if (color.invertExtent) {
                const thresholds
                    = color.thresholds ? color.thresholds() // scaleQuantize
                        : color.quantiles ? color.quantiles() // scaleQuantile
                            : color.domain(); // scaleThreshold

                const thresholdFormat
                    = tickFormat === undefined ? d => d
                        : typeof tickFormat === "string" ? d3.format(tickFormat)
                            : tickFormat;

                x = d3.scaleLinear()
                    .domain([-1, color.range().length - 1])
                    .rangeRound([marginLeft, width - marginRight]);

                svg.append("g")
                    .selectAll("rect")
                    .data(color.range())
                    .join("rect")
                    .attr("x", (d, i) => x(i - 1))
                    .attr("y", marginTop)
                    .attr("width", (d, i) => x(i) - x(i - 1))
                    .attr("height", height - marginTop - marginBottom)
                    .attr("fill", d => d);

                tickValues = d3.range(thresholds.length);
                tickFormat = i => thresholdFormat(thresholds[i], i);
            }

            // Ordinal
            else {
                x = d3.scaleBand()
                    .domain(color.domain())
                    .rangeRound([marginLeft, width - marginRight]);

                svg.append("g")
                    .selectAll("rect")
                    .data(color.domain())
                    .join("rect")
                    .attr("x", x)
                    .attr("y", marginTop)
                    .attr("width", Math.max(0, x.bandwidth() - 1))
                    .attr("height", height - marginTop - marginBottom)
                    .attr("fill", color);

                tickAdjust = () => { };
            }

            svg.append("g")
                .attr("transform", `translate(0, ${height - marginBottom})`)
                .call(d3.axisBottom(x)
                    .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
                    .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
                    .tickSize(tickSize)
                    .tickValues(tickValues))
                .call(tickAdjust)
                .call(g => g.select(".domain").remove())
                .call(g => g.append("text")
                    .attr("x", marginLeft)
                    .attr("y", marginTop + marginBottom - height - 6)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .text(title));

            return svg.node();
        }

        const p = Math.max(0, d3.precisionFixed(0.05) - 2),
            legendScale = d3.scaleQuantize([0.003, 0.75], d3.schemeGreens[9]);
        US_MAP.append('g')
            .attr('transform', `translate(600, 0)`)
            .append(() => legend({ color: legendScale, width: 260, tickFormat: "." + p + "%" }));
    });
