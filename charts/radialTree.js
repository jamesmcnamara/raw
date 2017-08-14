(function(){

    var tree = raw.model();

    var hierarchy = tree.dimension('hierarchy')
       .title('Hierarchy')
       .description("Key for relationships")
       .required(1)

    var mapsTo = tree.dimension('mapsTo')
       .title('Maps To')
       .description("The field that hierarchy refers to in each row")
       .required(1)

    var size = tree.dimension('size')
       .title('Size')
       .description("This is a description of the hierarchy that illustrates what the dimension is for and other things.")
       .accessor(d => +d)
       .types(Number)

    var color = tree.dimension('color')
       .title('Color')

    var label = tree.dimension('label')
       .title('Label')
       .multiple(true)

    function findChildren(root, nodes) {
      var children = nodes
        .filter(node => hierarchy(node) === mapsTo(root))
        .map(node => findChildren(node, nodes))

      return {
        children,
        name: mapsTo(root),
        color: color(root),
        label: label(root),
        size: (size() ? size(root) : 1) + children.reduce((acc, child) => acc + child.size, 0)
      }
    }
    
    tree.map(function (data) {
      if (!hierarchy() || !mapsTo()) return {children: []}

      var [roots, children] = _.partition(data, d =>
          !data.find(d2 => hierarchy(d) === mapsTo(d2)))

      return {
        children: roots.map(root => findChildren(root, children)),
      }

    })

    var chart = raw.chart()
        .title('Radial Tree')
        .description("Polar tree")
        .thumbnail("imgs/circularDendrogram.png")
        .category('Hierarchy')
        .model(tree)

    var radius = chart.number()
        .title("Radius")
        .defaultValue(1000)
        .fitToWidth(true)


    var colors = chart.color()
         .title("Color scale")

  chart.draw(function (selection, data) {
    var tooltip = d3.select('body')
      .style('position', 'relative')
      .append('div')
      .style('position', 'absolute')
      .style('background', '#f4f4f4')
      .style('opacity', 0)
      .attr('class', 'radial-tooltip')

    var g = selection
        .attr("width", +radius() )
        .attr("height", +radius() )
        .append("g")
        .attr("transform", "translate(" + radius()/2 + "," + radius()/2 + ")");

    var cluster = d3.layout.cluster()
        .size([360, radius()/2-120]);

    var nodes = window.nodes = cluster.nodes(data);
    var links = window.links = cluster.links(nodes);
    var maxDepth = nodes.reduce((max, d) => Math.max(max, d.depth), 0) + 1;
    var levelHeight = radius() / maxDepth / 2;

    var diagonal = d3.linkRadial()
      .angle(function(d) { return d.x / 180 * Math.PI})
      .radius(getHeight)


    function getHeight(d) {
      return (d.depth || 0) * levelHeight
    }

    colors.domain(links, d => d.target.color);
    var link = g.selectAll("path.link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .style("fill","none")
        .style("stroke", d => colors()(d.source.color))
        .style("stroke-width","1px") 
        .attr("d", diagonal);

    var node = g.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (getHeight(d)) + ")"; })

    node.append("circle")
        .attr("r", function (d) { return ((d.size || 0) + 1) * 2.5})
        .style("fill", d => colors()(d.color))
        .style("stroke", '#ffffff')
        .style("stroke-width","1px")

    node.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function(d) { return d.name; })
        .style("font-size","11px")
        .style("font-family","Arial, Helvetica")
  })
})()
