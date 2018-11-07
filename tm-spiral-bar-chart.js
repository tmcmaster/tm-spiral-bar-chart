import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import * as d3 from "d3v4";

/**
 * `tm-spiral-bar-chart`
 * Spiral bar chart Polymer web component.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class TmSpiralBarChart extends PolymerElement {
    static get template() {
        return html`
            <style>
                :host {
                    display: block;
                    font-family: 'Lucida Grande', 'Lucida Sans Unicode', 'Geneva', 'Verdana', sans-serif;
                    margin: 2px;
                }

                .axis path {
                    fill: none;
                    stroke: #999;
                    stroke-dasharray: 2 3;
                }
                .axis text {
                    font-size: 13px;
                    stroke: #222;
                }
                    text.title {
                    font-size: 24px;
                }
                circle.tick {
                    fill: #f3f3f3;
                    stroke: #999;
                    stroke-dasharray: 2 3;
                }
                path.spiral {
                    fill: none;
                    stroke: #ee8d18;
                    stroke-width: 3px;
                }

                .tooltip {
                    background: #eee;
                    box-shadow: 0 0 5px #999999;
                    color: #333;
                    font-size: 12px;
                    left: 130px;
                    padding: 10px;
                    position: absolute;
                    text-align: center;
                    top: 95px;
                    z-index: 10;
                    display: block;
                    opacity: 0;
                }
                svg {
                    /*border: solid red 2px;*/
                    /*box-sizing: border-box;*/
                }
                
            </style>
            <div id="chart"></div>
        `;
    }

    static get properties() {
        return {
            data: {
                type: Array
            },
            spirals: {
                type: Number,
                value: 3
            },
            size: {
                type: Number,
                value: 300
            },
            schema: {
                type: Object,
                value: {
                    key: 'date',
                    value: 'value',
                    group: 'group',
                    tooltip: [
                        {
                            key: 'date', title: 'Date', formatter: function (item) {
                                return item.toDateString()
                            }
                        },
                        {
                            key: 'value', title: 'Value', formatter: function (item) {
                                return Math.round(item * 100) / 100
                            }
                        },
                        {key: 'group', title: 'Group'}
                    ]
                }
            }
        };
    }

    static get observers() {
        return [
            '_rebuildGraph(data, size, schema, spirals)'
        ];
    }

    ready() {
        super.ready();
        // this.set('data', this.generateTestData());
    }



    _rebuildGraph(data, size, schema, spirals) {
        console.log('DATA / SCHEMA / SPIRALS: ', data, schema, spirals);
        if (data === undefined || data === null || spirals === undefined || spirals === null) return;

        this.setup(this.$.chart, size, data, schema, spirals);
    }

    setup(container, size, someData, config, spirals) {

        if (size === undefined || someData === undefined || config === undefined || spirals === undefined) {
            return;
        }
        let start = 0,
            end = 2.25,
            width = size,
            height = size,
            numSpirals = spirals,
            N = someData.length,
            marginSize = width / 30,
            margin = {top:marginSize,bottom:marginSize,left:marginSize,right:marginSize};

        d3.select(container).selectAll("*").remove();

        let theta = function(r) {
            return numSpirals * Math.PI * r;
        };

        // used to assign nodes color by group
        let color = d3.scaleOrdinal(d3.schemeCategory10);

        let r = d3.min([width, height]) / 2 - marginSize;

        let radius = d3.scaleLinear()
            .domain([start, end])
            .range([marginSize, r]);

        // TODO: centering and margin not working properly
        let center = {
            x: ((width / 2) + (margin.left * (4-spirals))/2),
            y: ((height / 2) + (margin.top * (6-spirals))/2 )
        };

        let svg = d3.select(container).append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + center.x + "," + center.y + ")");

        let points = d3.range(start, end + 0.001, (end - start) / 1000);

        let spiral = d3.radialLine()
            .curve(d3.curveCardinal)
            .angle(theta)
            .radius(radius);

        let path = svg.append("path")
            .datum(points)
            .attr("id", "spiral")
            .attr("d", spiral)
            .style("fill", "none")
            .style("stroke", "steelblue");


        let spiralLength = path.node().getTotalLength(),
            barWidth = (spiralLength / N) - 1;


        let timeScale = d3.scaleTime()
            .domain(d3.extent(someData, function(d){
                return d[config.key];
            }))
            .range([0, spiralLength]);

        // yScale for the bar height
        let yScale = d3.scaleLinear()
            .domain([0, d3.max(someData, function(d){
                return d[config.value];
            })])
            .range([0, (r / numSpirals) - 30]);

        svg.selectAll("rect")
            .data(someData)
            .enter()
            .append("rect")
            .attr("x", function(d,i){

                let linePer = timeScale(d[config.key]),
                    posOnLine = path.node().getPointAtLength(linePer),
                    angleOnLine = path.node().getPointAtLength(linePer - barWidth);

                d.linePer = linePer; // % distance are on the spiral
                d.x = posOnLine.x; // x postion on the spiral
                d.y = posOnLine.y; // y position on the spiral

                d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180 / Math.PI) - 90; //angle at the spiral position

                return d.x;
            })
            .attr("y", function(d){
                return d.y;
            })
            .attr("width", function(d){
                return barWidth;
            })
            .attr("height", function(d){
                return yScale(d[config.value]);
            })
            .style("fill", function(d){return color(d[config.group]);})
            .style("stroke", "none")
            .attr("transform", function(d){
                return "rotate(" + d.a + "," + d.x  + "," + d.y + ")"; // rotate the bar
            });

        // add date labels
        let tF = d3.timeFormat("%b %Y"),
            firstInMonth = {};

        svg.selectAll("text")
            .data(someData)
            .enter()
            .append("text")
            .attr("dy", 10)
            .style("text-anchor", "start")
            .style("font", "10px arial")
            .append("textPath")
            // only add for the first of each month
            .filter(function(d){
                let sd = tF(d[config.key]);
                if (!firstInMonth[sd]){
                    firstInMonth[sd] = 1;
                    return true;
                }
                return false;
            })
            .text(function(d){
                return tF(d[config.key]);
            })
            // place text along spiral
            .attr("xlink:href", "#spiral")
            .style("fill", "grey")
            .attr("startOffset", function(d){
                return ((d.linePer / spiralLength) * 100) + "%";
            })


        let tooltip = d3.select(container)
            .append('div')
            .attr('class', 'tooltip');

        config.tooltip.forEach((item) => {
            tooltip.append('div')
                .attr('class', item.key);
        });

        svg.selectAll("rect")
            .on('mouseover', function(d) {

                config.tooltip.forEach((item) => {
                    let valueString = (item.formatter ? item.formatter(d[item.key]) : d[item.key]);
                    tooltip.select('.' + item.key).html(item.title + ": <b>" + valueString + "</b>");
                });

                d3.select(this)
                    .style("fill","#FFFFFF")
                    .style("stroke","#000000")
                    .style("stroke-width","1px");

                tooltip.style('display', 'block');
                tooltip.style('opacity',2);

            })
            .on('mousemove', function(d) {
                tooltip.style('top', (d3.event.layerY + 10) + 'px')
                    .style('left', (d3.event.layerX - 25) + 'px');
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .style("fill",color(d[config.group]))
                    .style("stroke","none")
                    .style("stroke-width","2px");

                tooltip.style('display', 'none');
                tooltip.style('opacity',0);
            });
    }
}

window.customElements.define('tm-spiral-bar-chart', TmSpiralBarChart);
