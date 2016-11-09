import {
  createPanelComponent
} from '../panels';

import template from './parallelcoords.html';
import './parallelcoords.css';
import * as curves from 'common/curves';

import d3 from 'd3';

class ParallelCoordsController {

  constructor($element, datasetsSrv) {
    'ngInject';
    this.$element = $element;
    this.datasetsSrv = datasetsSrv;
  }

  $postLink() {
    this.requestData();
  }

  requestData() {
    this.datasetsSrv.getAllNumericData(this.panelCtrl.workspaceCtrl.datasetId).then(data => {
      this.data = data;
      this.createVisualization(this.$element[0]);
    });
  }

  // adapted from http://bl.ocks.org/jasondavies/1341281
  createVisualization(element) {

    let margin = {
        top: 30,
        right: 10,
        bottom: 10,
        left: 10
      },
      width = window.innerWidth - margin.left - margin.right,
      height = 0.95 * window.innerHeight - margin.top - margin.bottom - 150;

    let x = d3.scale.ordinal().rangePoints([0, width], 1),
      y = {},
      dragging = {};

    let line = d3.svg.line(),
      axis = d3.svg.axis().orient("left"),
      background,
      foreground;

    let position = (d) => {
      let v = dragging[d];
      return v === undefined ? x(d) : v;
    };

    let transition = (g) => {
      return g.transition().duration(500);
    };

    let cars = this.data;

    let dimensions = d3.keys(cars[0]).filter((d) => {
      return d !== "car" && d !== "id" && d !== "origin" && (y[d] = d3.scale.linear()
        .domain(d3.extent(cars, p => +p[d]))
        .range([height, 0]));
    });

    // Returns the path for a given data point.
    let path = (d) => {
      return line(dimensions.map(p => [position(p), y[p](d[p])]));
    };

    let curvePath = (d) => {
      return line(curves.computeCatmullRomPoints(dimensions.map(p => [position(p), y[p](d[p])])));
    };


    let brushstart = () => {
      d3.event.sourceEvent.stopPropagation();
    };

    // Handles a brush event, toggling the display of foreground lines.
    let brush = () => {
      let actives = dimensions.filter(p => !y[p].brush.empty()),
        extents = actives.map(p => y[p].brush.extent());
      foreground.style("display", (d) => {
        return actives.every((p, i) => {
          return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        }) ? null : "none";
      });
    };

    var vbW = width + margin.left + margin.right;
    var vbH = height + margin.top + margin.bottom;

    let svg = d3.select($(element).find('.parallel-coords-container')[0])
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .style("padding-bottom", (vbW / vbH) * 100 + "%")
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + vbW + " " + vbH)
      .classed("svg-content-responsive", true)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions);

    // Add grey background lines for context.
    background = svg.append("g")
      .attr("class", "background")
      .selectAll("path")
      .data(cars)
      .enter().append("path")
      .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(cars)
      .enter().append("path")
      .attr("d", path);

    // Add a group element for each dimension.
    let g = svg.selectAll(".dimension")
      .data(dimensions)
      .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", d => "translate(" + x(d) + ")")
      .call(d3.behavior.drag()
        .origin(d => {
          return {
            x: x(d)
          };
        })
        .on("dragstart", (d) => {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", (d) => {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort((a, b) => position(a) - position(b));
          x.domain(dimensions);
          g.attr("transform", d => "translate(" + position(d) + ")");
        })
        .on("dragend", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
            .attr("d", path)
            .transition()
            .delay(500)
            .duration(0)
            .attr("visibility", null);
        }));

    // Add an axis and title.
    g.append("g")
      .attr("class", "axis")
      .each(function(d) {
        d3.select(this).call(axis.scale(y[d]));
      })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(d => d);

    // Add and store a brush for each axis.
    g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

    this.setStraightLines = () => {
      svg.selectAll(".foreground").selectAll("path").attr("d", path);
      svg.selectAll(".background").selectAll("path").attr("d", path);
    };

    this.setCurvedLines = () => {
      svg.selectAll(".foreground").selectAll("path").attr("d", curvePath);
      svg.selectAll(".background").selectAll("path").attr("d", curvePath);
    };

  }
}

export default createPanelComponent(template, ParallelCoordsController);