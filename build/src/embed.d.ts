import { Operation } from 'fast-json-patch';
import * as vegaImport from 'vega';
import { EncodeEntryName, Loader, LoaderOptions, Renderers, Spec as VgSpec, TooltipHandler, View } from 'vega';
import * as vegaLiteImport from 'vega-lite';
import { TopLevelSpec as VlSpec } from 'vega-lite';
import { Options as TooltipOptions } from 'vega-tooltip';
import { Config, Mode } from './types';
export * from './types';
export declare const vega: typeof vegaImport;
export declare let vegaLite: typeof vegaLiteImport;
export interface Actions {
    export?: boolean | {
        svg?: boolean;
        png?: boolean;
    };
    source?: boolean;
    compiled?: boolean;
    editor?: boolean;
}
export declare const DEFAULT_ACTIONS: {
    export: {
        svg: boolean;
        png: boolean;
    };
    source: boolean;
    compiled: boolean;
    editor: boolean;
};
export interface Hover {
    hoverSet?: EncodeEntryName;
    updateSet?: EncodeEntryName;
}
export declare type PatchFunc = (spec: VgSpec) => VgSpec;
declare const I18N: {
    CLICK_TO_VIEW_ACTIONS: string;
    COMPILED_ACTION: string;
    EDITOR_ACTION: string;
    PNG_ACTION: string;
    SOURCE_ACTION: string;
    SVG_ACTION: string;
};
export interface EmbedOptions<S = string> {
    actions?: boolean | Actions;
    mode?: Mode;
    theme?: 'excel' | 'ggplot2' | 'quartz' | 'vox' | 'dark' | 'grafana';
    defaultStyle?: boolean | string;
    logLevel?: number;
    loader?: Loader | LoaderOptions;
    renderer?: Renderers;
    tooltip?: TooltipHandler | TooltipOptions | boolean;
    patch?: S | PatchFunc | Operation[];
    width?: number;
    height?: number;
    padding?: number | {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
    scaleFactor?: number;
    config?: S | Config;
    sourceHeader?: string;
    sourceFooter?: string;
    editorUrl?: string;
    hover?: boolean | Hover;
    i18n?: Partial<typeof I18N>;
    downloadFileName?: string;
    formatLocale?: object;
    timeFormatLocale?: object;
}
export declare type VisualizationSpec = VlSpec | VgSpec;
export interface Result {
    /** The Vega view. */
    view: View;
    /** The inut specification. */
    spec: VisualizationSpec;
    /** The compiled and patched Vega specification. */
    vgSpec: VgSpec;
    /** Removes references to unwanted behaviors and memory leaks. Calls Vega's `view.finalize`.  */
    finalize: () => void;
}
/**
 * Try to guess the type of spec.
 *
 * @param spec Vega or Vega-Lite spec.
 */
export declare function guessMode(spec: VisualizationSpec, providedMode?: Mode): Mode;
/**
 * Embed a Vega visualization component in a web page. This function returns a promise.
 *
 * @param el        DOM element in which to place component (DOM node or CSS selector).
 * @param spec      String : A URL string from which to load the Vega specification.
 *                  Object : The Vega/Vega-Lite specification as a parsed JSON object.
 * @param opts       A JavaScript object containing options for embedding.
 */
export default function embed(el: HTMLElement | string, spec: VisualizationSpec | string, opts?: EmbedOptions): Promise<Result>;
//# sourceMappingURL=embed.d.ts.map