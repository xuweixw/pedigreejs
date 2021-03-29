import {getposition, setposition} from './pedcache.js';

let zoom, xi, yi;

// zoom and drag
export function get_zoom(opts) {
	zoom = d3.zoom()
	  .scaleExtent([opts.zoomIn, opts.zoomOut])
	  .filter(function() {
			if(d3.event.type === 'dblclick') return false;
			if(!opts.zoomSrc || opts.zoomSrc.indexOf('wheel') === -1) {
				if(d3.event.type && d3.event.type === 'wheel') return false
			}
			console.log("zoom", d3.event.type, d3.event);
			return  true})
	  .on('zoom', function() { zoomFn(opts) });
	return zoom;	  
}

export function set_initial_xy(opts) {
	xi = opts.symbol_size/2;
	yi = -opts.symbol_size*2.5;
}

// find width/height of pedigree graphic
function get_dimensions(opts) {
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	let xmin = Number.MAX_VALUE;
	let xmax = -1000000;
	let ymin = Number.MAX_VALUE;
	let ymax = -1000000;
	let sym2 = opts.symbol_size/2;
	ped.selectAll('g').each(function(d, _i) {
		if(d.x && d.data.name !== 'hidden_root') {
			if(d.x-sym2 < xmin) xmin = d.x-sym2;
			if(d.x+sym2 > xmax) xmax = d.x+sym2;
			if(d.y-sym2 < ymin) ymin = d.y-sym2;
			if(d.y+sym2 > ymax) ymax = d.y+sym2;
		}
	});
	return {wid: Math.abs(xmax-xmin), hgt: Math.abs(ymax-ymin)};
}

function zoomFn(opts) {
	let t = d3.event.transform;
	if(d3.event.sourceEvent && d3.event.sourceEvent.type === 'mousemove') {
		let xyk = getposition(opts);
		if(xyk.length == 3) t.k = xyk[2];
	}
	transform_pedigree(opts, t.x+(xi*t.k), t.y+(yi*t.k), t.k);
    return;
}

// scale size the pedigree
export function btn_zoom(opts, scale) {
	let xyk = getposition(opts);  // cached position
	let k = (xyk.length == 3 ? xyk[2]*scale : 1*scale);
	let x = (xyk[0] !== null ? xyk[0] : xi)-(xi*k);
	let y = (xyk[1] !== null ? xyk[1] : yi)-(yi*k);

	if(k < opts.zoomIn || k > opts.zoomOut) {
		if(xyk.length == 3) {
			let ck = xyk[2];
			let zoomOut = (k < ck);
			if(zoomOut  && k < opts.zoomIn) return;
			if(!zoomOut && k > opts.zoomOut) return;
		} else {
			return;
		}
	}

	let svg = d3.select("#"+opts.targetDiv).select("svg");
	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(x, y);
    svg.transition().duration(700).call(zoom.transform, transform); 	// apply new zoom transform:
}

export function zoom_identity(opts) {
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	svg.call(zoom.transform, d3.zoomIdentity);
}

export function scale_to_fit(opts) {
	let d = get_dimensions(opts);
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	let wfull = svg.node().clientWidth,
	    hfull = svg.node().clientHeight;
	let k = 0.90 / Math.max(d.wid/wfull, d.hgt/hfull);

	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(-opts.symbol_size*1.5*k, 0);
    svg.transition().duration(700).call(zoom.transform, transform); 	// apply new zoom transform:
}

function transform_pedigree(opts, x, y, k) {
	setposition(opts, x, y, (k !== 1 ? k : undefined));
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	ped.attr('transform', 'translate(' + x + ',' + y + ') scale(' + k + ')');
}
