var _a;
import { __awaiter } from "tslib";
import { applyPatch } from 'fast-json-patch';
import stringify from 'json-stringify-pretty-compact';
import { satisfies } from 'semver';
import * as vegaImport from 'vega';
import * as vegaLiteImport from 'vega-lite';
import schemaParser from 'vega-schema-url-parser';
import * as themes from 'vega-themes';
import { Handler } from 'vega-tooltip';
import { isBoolean, isString, mergeConfig } from 'vega-util';
import post from './post';
import embedStyle from './style';
import { mergeDeep } from './util';
export * from './types';
export const vega = vegaImport;
export let vegaLite = vegaLiteImport;
// For backwards compatibility with Vega-Lite before v4.
const w = (typeof window !== 'undefined' ? window : undefined);
if (vegaLite === undefined && ((_a = w === null || w === void 0 ? void 0 : w['vl']) === null || _a === void 0 ? void 0 : _a.compile)) {
    vegaLite = w['vl'];
}
export const DEFAULT_ACTIONS = { export: { svg: true, png: true }, source: true, compiled: true, editor: true };
const I18N = {
    CLICK_TO_VIEW_ACTIONS: 'Click to view actions',
    COMPILED_ACTION: 'View Compiled Vega',
    EDITOR_ACTION: 'Open in Vega Editor',
    PNG_ACTION: 'Save as PNG',
    SOURCE_ACTION: 'View Source',
    SVG_ACTION: 'Save as SVG'
};
const NAMES = {
    vega: 'Vega',
    'vega-lite': 'Vega-Lite'
};
const VERSION = {
    vega: vega.version,
    'vega-lite': vegaLite ? vegaLite.version : 'not available'
};
const PREPROCESSOR = {
    vega: (vgSpec) => vgSpec,
    'vega-lite': (vlSpec, config) => vegaLite.compile(vlSpec, { config: config }).spec
};
const SVG_CIRCLES = `
<svg viewBox="0 0 16 16" fill="currentColor" stroke="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <circle r="2" cy="8" cx="2"></circle>
  <circle r="2" cy="8" cx="8"></circle>
  <circle r="2" cy="8" cx="14"></circle>
</svg>`;
function isTooltipHandler(h) {
    return typeof h === 'function';
}
function viewSource(source, sourceHeader, sourceFooter, mode) {
    const header = `<html><head>${sourceHeader}</head><body><pre><code class="json">`;
    const footer = `</code></pre>${sourceFooter}</body></html>`;
    const win = window.open('');
    win.document.write(header + source + footer);
    win.document.title = `${NAMES[mode]} JSON Source`;
}
/**
 * Try to guess the type of spec.
 *
 * @param spec Vega or Vega-Lite spec.
 */
export function guessMode(spec, providedMode) {
    var _a;
    // Decide mode
    if (spec.$schema) {
        const parsed = schemaParser(spec.$schema);
        if (providedMode && providedMode !== parsed.library) {
            console.warn(`The given visualization spec is written in ${NAMES[parsed.library]}, but mode argument sets ${(_a = NAMES[providedMode]) !== null && _a !== void 0 ? _a : providedMode}.`);
        }
        const mode = parsed.library;
        if (!satisfies(VERSION[mode], `^${parsed.version.slice(1)}`)) {
            console.warn(`The input spec uses ${NAMES[mode]} ${parsed.version}, but the current version of ${NAMES[mode]} is v${VERSION[mode]}.`);
        }
        return mode;
    }
    // try to guess from the provided spec
    if ('mark' in spec ||
        'encoding' in spec ||
        'layer' in spec ||
        'hconcat' in spec ||
        'vconcat' in spec ||
        'facet' in spec ||
        'repeat' in spec) {
        return 'vega-lite';
    }
    if ('marks' in spec || 'signals' in spec || 'scales' in spec || 'axes' in spec) {
        return 'vega';
    }
    return providedMode !== null && providedMode !== void 0 ? providedMode : 'vega';
}
function isLoader(o) {
    return !!(o && 'load' in o);
}
/**
 * Embed a Vega visualization component in a web page. This function returns a promise.
 *
 * @param el        DOM element in which to place component (DOM node or CSS selector).
 * @param spec      String : A URL string from which to load the Vega specification.
 *                  Object : The Vega/Vega-Lite specification as a parsed JSON object.
 * @param opts       A JavaScript object containing options for embedding.
 */
export default function embed(el, spec, opts = {}) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const loader = isLoader(opts.loader) ? opts.loader : vega.loader(opts.loader);
        // load spec, config, and patch that are references by URLs
        const parsedSpec = isString(spec) ? JSON.parse(yield loader.load(spec)) : spec;
        const usermetaOpts = yield loadOpts((_a = (parsedSpec.usermeta && parsedSpec.usermeta['embedOptions'])) !== null && _a !== void 0 ? _a : {}, loader);
        const parsedOpts = yield loadOpts(opts, loader);
        const mergedOpts = Object.assign(Object.assign({}, mergeDeep(parsedOpts, usermetaOpts)), { config: mergeConfig((_b = parsedOpts.config) !== null && _b !== void 0 ? _b : {}, (_c = usermetaOpts.config) !== null && _c !== void 0 ? _c : {}) });
        return yield _embed(el, parsedSpec, mergedOpts, loader);
    });
}
function loadOpts(opt, loader) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const config = isString(opt.config) ? JSON.parse(yield loader.load(opt.config)) : (_a = opt.config) !== null && _a !== void 0 ? _a : {};
        const patch = isString(opt.patch) ? JSON.parse(yield loader.load(opt.patch)) : opt.patch;
        return Object.assign(Object.assign(Object.assign({}, opt), (patch ? { patch } : {})), (config ? { config } : {}));
    });
}
function _embed(el, spec, opts = {}, loader) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const config = opts.theme ? mergeConfig(themes[opts.theme], (_a = opts.config) !== null && _a !== void 0 ? _a : {}) : opts.config;
        const actions = isBoolean(opts.actions) ? opts.actions : mergeDeep({}, DEFAULT_ACTIONS, (_b = opts.actions) !== null && _b !== void 0 ? _b : {});
        const i18n = Object.assign(Object.assign({}, I18N), opts.i18n);
        const renderer = (_c = opts.renderer) !== null && _c !== void 0 ? _c : 'canvas';
        const logLevel = (_d = opts.logLevel) !== null && _d !== void 0 ? _d : vega.Warn;
        const downloadFileName = (_e = opts.downloadFileName) !== null && _e !== void 0 ? _e : 'visualization';
        if (opts.defaultStyle !== false) {
            // Add a default stylesheet to the head of the document.
            const ID = 'vega-embed-style';
            if (!document.getElementById(ID)) {
                const style = document.createElement('style');
                style.id = ID;
                style.innerText =
                    opts.defaultStyle === undefined || opts.defaultStyle === true
                        ? (embedStyle !== null && embedStyle !== void 0 ? embedStyle : '').toString()
                        : opts.defaultStyle;
                document.head.appendChild(style);
            }
        }
        const mode = guessMode(spec, opts.mode);
        let vgSpec = PREPROCESSOR[mode](spec, config);
        if (mode === 'vega-lite') {
            if (vgSpec.$schema) {
                const parsed = schemaParser(vgSpec.$schema);
                if (!satisfies(VERSION.vega, `^${parsed.version.slice(1)}`)) {
                    console.warn(`The compiled spec uses Vega ${parsed.version}, but current version is v${VERSION.vega}.`);
                }
            }
        }
        const div = typeof el === 'string' ? document.querySelector(el) : el;
        if (!div) {
            throw Error(`${el} does not exist`);
        }
        div.classList.add('vega-embed');
        if (actions) {
            div.classList.add('has-actions');
        }
        div.innerHTML = ''; // clear container
        const patch = opts.patch;
        if (patch) {
            if (patch instanceof Function) {
                vgSpec = patch(vgSpec);
            }
            else {
                vgSpec = applyPatch(vgSpec, patch, true, false).newDocument;
            }
        }
        // Set locale. Note that this is a global setting.
        if (opts.formatLocale) {
            vega.formatLocale(opts.formatLocale);
        }
        if (opts.timeFormatLocale) {
            vega.timeFormatLocale(opts.timeFormatLocale);
        }
        // Do not apply the config to Vega when we have already applied it to Vega-Lite.
        // This call may throw an Error if parsing fails.
        const runtime = vega.parse(vgSpec, mode === 'vega-lite' ? {} : config);
        const view = new vega.View(runtime, {
            loader,
            logLevel,
            renderer
        });
        if (opts.tooltip !== false) {
            let handler;
            if (isTooltipHandler(opts.tooltip)) {
                handler = opts.tooltip;
            }
            else {
                // user provided boolean true or tooltip options
                handler = new Handler(opts.tooltip === true ? {} : opts.tooltip).call;
            }
            view.tooltip(handler);
        }
        let { hover } = opts;
        if (hover === undefined) {
            hover = mode === 'vega';
        }
        if (hover) {
            const { hoverSet, updateSet } = (typeof hover === 'boolean' ? {} : hover);
            view.hover(hoverSet, updateSet);
        }
        if (opts) {
            if (opts.width != null) {
                view.width(opts.width);
            }
            if (opts.height != null) {
                view.height(opts.height);
            }
            if (opts.padding != null) {
                view.padding(opts.padding);
            }
        }
        yield view.initialize(el).runAsync();
        let documentClickHandler;
        if (actions !== false) {
            let wrapper = div;
            if (opts.defaultStyle !== false) {
                const details = document.createElement('details');
                details.title = i18n.CLICK_TO_VIEW_ACTIONS;
                div.append(details);
                wrapper = details;
                const summary = document.createElement('summary');
                summary.innerHTML = SVG_CIRCLES;
                details.append(summary);
                documentClickHandler = (ev) => {
                    if (!details.contains(ev.target)) {
                        details.removeAttribute('open');
                    }
                };
                document.addEventListener('click', documentClickHandler);
            }
            const ctrl = document.createElement('div');
            wrapper.append(ctrl);
            ctrl.classList.add('vega-actions');
            // add 'Export' action
            if (actions === true || actions.export !== false) {
                for (const ext of ['svg', 'png']) {
                    if (actions === true || actions.export === true || actions.export[ext]) {
                        const i18nExportAction = i18n[`${ext.toUpperCase()}_ACTION`];
                        const exportLink = document.createElement('a');
                        exportLink.text = i18nExportAction;
                        exportLink.href = '#';
                        exportLink.target = '_blank';
                        exportLink.download = `${downloadFileName}.${ext}`;
                        // add link on mousedown so that it's correct when the click happens
                        exportLink.addEventListener('mousedown', function (e) {
                            return __awaiter(this, void 0, void 0, function* () {
                                e.preventDefault();
                                const url = yield view.toImageURL(ext, opts.scaleFactor);
                                this.href = url;
                            });
                        });
                        ctrl.append(exportLink);
                    }
                }
            }
            // add 'View Source' action
            if (actions === true || actions.source !== false) {
                const viewSourceLink = document.createElement('a');
                viewSourceLink.text = i18n.SOURCE_ACTION;
                viewSourceLink.href = '#';
                viewSourceLink.addEventListener('click', function (e) {
                    var _a, _b;
                    viewSource(stringify(spec), (_a = opts.sourceHeader) !== null && _a !== void 0 ? _a : '', (_b = opts.sourceFooter) !== null && _b !== void 0 ? _b : '', mode);
                    e.preventDefault();
                });
                ctrl.append(viewSourceLink);
            }
            // add 'View Compiled' action
            if (mode === 'vega-lite' && (actions === true || actions.compiled !== false)) {
                const compileLink = document.createElement('a');
                compileLink.text = i18n.COMPILED_ACTION;
                compileLink.href = '#';
                compileLink.addEventListener('click', function (e) {
                    var _a, _b;
                    viewSource(stringify(vgSpec), (_a = opts.sourceHeader) !== null && _a !== void 0 ? _a : '', (_b = opts.sourceFooter) !== null && _b !== void 0 ? _b : '', 'vega');
                    e.preventDefault();
                });
                ctrl.append(compileLink);
            }
            // add 'Open in Vega Editor' action
            if (actions === true || actions.editor !== false) {
                const editorUrl = (_f = opts.editorUrl) !== null && _f !== void 0 ? _f : 'https://vega.github.io/editor/';
                const editorLink = document.createElement('a');
                editorLink.text = i18n.EDITOR_ACTION;
                editorLink.href = '#';
                editorLink.addEventListener('click', function (e) {
                    post(window, editorUrl, {
                        config: config,
                        mode,
                        renderer,
                        spec: stringify(spec)
                    });
                    e.preventDefault();
                });
                ctrl.append(editorLink);
            }
        }
        function finalize() {
            if (documentClickHandler) {
                document.removeEventListener('click', documentClickHandler);
            }
            view.finalize();
        }
        return { view, spec, vgSpec, finalize };
    });
}
//# sourceMappingURL=embed.js.map