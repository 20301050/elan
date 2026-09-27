/* Élan : petit moteur d'affichage des pages (gabarits + logique) */
(function () {
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (p) {
    var next = typeof p === "function" ? p(this.state, this.props) : p;
    Object.assign(this.state, next); if (this.__render) this.__render();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__render) this.__render(); };
  window.DCLogic = DCLogic;
  var SVG = "http://www.w3.org/2000/svg";
  function look(path, sc) {
    path = path.trim();
    if (path === "true") return true; if (path === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    if (/^['"].*['"]$/.test(path)) return path.slice(1, -1);
    var p = path.split("."), v = sc;
    for (var i = 0; i < p.length; i++) { if (v == null) return undefined; v = v[p[i]]; }
    return v;
  }
  function interp(s, sc) {
    var m = s.match(/^\s*\{\{([^}]+)\}\}\s*$/); if (m) return look(m[1], sc);
    return s.replace(/\{\{([^}]+)\}\}/g, function (_, p) { var v = look(p, sc); return v == null ? "" : v; });
  }
  function render(node, sc, out, ns) {
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out.appendChild(document.createTextNode(interp(n.textContent, sc))); return; }
      if (n.nodeType !== 1) return;
      var t = n.tagName.toLowerCase();
      if (t === "sc-if") { if (interp(n.getAttribute("value"), sc)) render(n, sc, out, ns); return; }
      if (t === "sc-for") {
        var list = interp(n.getAttribute("list"), sc) || [], as = n.getAttribute("as") || "item";
        list.forEach(function (it, i) { var s2 = Object.assign({}, sc); s2[as] = it; s2.$index = i; render(n, s2, out, ns); });
        return;
      }
      var nns = (t === "svg" || ns) ? SVG : null;
      var e = nns ? document.createElementNS(nns, n.tagName) : document.createElement(t);
      for (var k = 0; k < n.attributes.length; k++) {
        var a = n.attributes[k], v = interp(a.value, sc);
        if (/^on/i.test(a.name)) {
          if (typeof v === "function") (function (fn, ev) { e.addEventListener(ev, function (x) { if (ev === "click" && e.tagName === "A" && !e.getAttribute("href")) x.preventDefault(); fn(x); }); })(v, a.name.slice(2).toLowerCase());
          continue;
        }
        if (v === false || v == null || typeof v === "function") continue;
        if (v === true) v = "";
        e.setAttribute(a.name, v);
      }
      render(n.content || n, sc, e, nns); out.appendChild(e);
    });
  }
  window.Elan = {
    mount: function (tplId, rootId, Component) {
      var tpl = document.getElementById(tplId), root = document.getElementById(rootId);
      var c = new Component({});
      c.__render = function () {
        var keep = {};
        root.querySelectorAll("input,textarea,select").forEach(function (f, i) { keep[f.name || f.id || i] = f.value; });
        root.innerHTML = ""; render(tpl.content, c.renderVals(), root);
        root.querySelectorAll("input,textarea,select").forEach(function (f, i) { var k = f.name || f.id || i; if (k in keep && f.type !== "submit") f.value = keep[k]; });
      };
      c.__render();
      if (c.componentDidMount) c.componentDidMount();
    }
  };
})();
