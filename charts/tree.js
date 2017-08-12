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

        /* children.forEach(function(d) {
        var leaf = seek(root, hierarchy(d), hierarchy()[0]);
        if(leaf === false || !leaf) return;

        if (!leaf.size) leaf.size = 0;
        leaf.size += size() ? +size(d) : 1;

        //console.log(leaf, color(), color(d))
        leaf.color = color(d);
        leaf.label = label(d);

        delete leaf.children;
      });
      return root;
      */
    })
    /*
    function seek(root, path, klass) {
      if (path.length < 1) return false;
      if (!root.children) root.children = [];
      var p = root.children.filter(function (d){ return d.name == path[0]; })[0];

      if (!p) {
        if( /\S/.test(path[0]) ) {
          p = { name: path[0], class:klass, children:[]};
          root.children.push(p);
        } else p = root;
      }
      return p;
    }
    */

    var chart = raw.chart()
        .title('Tree')
        .description(
            "Dendrograms are tree-like diagrams used to represent the distribution of a hierarchical clustering. The different depth levels represented by each node are visualized on the horizontal axes and it is useful to visualize a non-weighted hierarchy.<br />Based on <br /><a href='http://bl.ocks.org/mbostock/4063570'>http://bl.ocks.org/mbostock/4063570</a>")
        .thumbnail("imgs/dendrogram.png")
        .category('Hierarchy')
        .model(tree)

    var width = chart.number()
        .title("Width")
        .defaultValue(2000)
        .fitToWidth(true)

    var height = chart.number()
        .title("Height")
        .defaultValue(500)

    var colors = chart.color()
         .title("Color scale")

    chart.draw(function (selection, data){

        var g = selection
            .attr("width", +width() )
            .attr("height", +height() )
            .append("g")
            .attr("transform", "translate(40,0)");

        var cluster = d3.layout.cluster()
          .size([+height(), +width() - 160]);

        var diagonal = d3.svg.diagonal()
            .projection(function (d) { return [d.y, d.x]; });

        var nodes = cluster.nodes(data),
            links = cluster.links(nodes);

        colors.domain(links, d => d.target.color);

        var link = g.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .style("fill","none")
            .style("stroke","#cccccc")
            .style("stroke-width","1px")
            .attr("d", diagonal);

        var node = g.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

        node.append("circle")
            .attr("r", d => d.size * 4.5)
            .style("fill", d => colors()(d.color))
            .style("stroke","#999999")
            .style("stroke-width","1px")

        node.append("text")
            .style("font-size","11px")
            .style("font-family","Arial, Helvetica")
            .attr("dx", function(d) { return d.children ? -8 : 8; })
            .attr("dy", 3)
            .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            .text(function(d) { return d.name; });

  })
})();
