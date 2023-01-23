
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Pages/Main.svelte generated by Svelte v3.47.0 */

    const file$8 = "src/Pages/Main.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let div0;
    	let p0;
    	let t1;
    	let div1;
    	let p1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "C++ Korea에 오신것을 환영합니다.";
    			t1 = space();
    			div1 = element("div");
    			p1 = element("p");
    			attr_dev(p0, "class", "svelte-rgdk2o");
    			add_location(p0, file$8, 6, 2, 71);
    			attr_dev(div0, "class", "asdf");
    			add_location(div0, file$8, 5, 1, 50);
    			attr_dev(p1, "class", "svelte-rgdk2o");
    			add_location(p1, file$8, 11, 2, 125);
    			add_location(div1, file$8, 10, 1, 117);
    			attr_dev(main, "class", "svelte-rgdk2o");
    			add_location(main, file$8, 4, 0, 42);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, p0);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, p1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	let files;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ files });

    	$$self.$inject_state = $$props => {
    		if ('files' in $$props) files = $$props.files;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Pages/About.svelte generated by Svelte v3.47.0 */

    const file$7 = "src/Pages/About.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h20;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let h21;
    	let t6;
    	let div1;
    	let a0;
    	let div0;
    	let svg0;
    	let path0;
    	let t7;
    	let h22;
    	let t9;
    	let p0;
    	let t11;
    	let p1;
    	let t13;
    	let t14;
    	let div3;
    	let a1;
    	let div2;
    	let svg1;
    	let path1;
    	let t15;
    	let h23;
    	let t17;
    	let p2;
    	let t19;
    	let p3;
    	let t21;
    	let p4;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "\"끊임없이 공부하고 끊임없이 노력합니다.\"";
    			t1 = space();
    			h20 = element("h2");
    			t2 = text("C++ Korea는 2013년 11월에 설립 된 그룹으로\n\t\t");
    			br = element("br");
    			t3 = text("\n\t\tC++의 저변확대를 위한 보급에 힘쓰는 단체입니다.");
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "C++ Korea는 Meta(구 Facebook)에서 2013년 11월에 설립 된 이래 비영리 단체로의 도약을 준비하고 있습니다.";
    			t6 = space();
    			div1 = element("div");
    			a0 = element("a");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t7 = space();
    			h22 = element("h2");
    			h22.textContent = "C++ Korea 그룹으로 이동";
    			t9 = space();
    			p0 = element("p");
    			p0.textContent = "C++ Korea Meta(facebook) 그룹입니다";
    			t11 = space();
    			p1 = element("p");
    			p1.textContent = "질문 및 답변 등을 할 수 있습니다.";
    			t13 = text("\n\t\t\t\tfacebook.com/groups/cppkorea");
    			t14 = space();
    			div3 = element("div");
    			a1 = element("a");
    			div2 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t15 = space();
    			h23 = element("h2");
    			h23.textContent = "C++ Korea Github로 이동";
    			t17 = space();
    			p2 = element("p");
    			p2.textContent = "C++ Korea에서 진행한 세미나, 스터디,";
    			t19 = space();
    			p3 = element("p");
    			p3.textContent = "핵심 가이드라인이 저장된 Git 저장소입니다.";
    			t21 = space();
    			p4 = element("p");
    			p4.textContent = "github.com/cppkorea";
    			attr_dev(h1, "class", "svelte-1akomx2");
    			add_location(h1, file$7, 5, 4, 42);
    			add_location(br, file$7, 10, 2, 137);
    			attr_dev(h20, "class", "svelte-1akomx2");
    			add_location(h20, file$7, 8, 4, 93);
    			attr_dev(h21, "class", "svelte-1akomx2");
    			add_location(h21, file$7, 13, 1, 184);
    			attr_dev(path0, "fill", "currentColor");
    			attr_dev(path0, "d", "M448 56.7v398.5c0 13.7-11.1 24.7-24.7 24.7H309.1V306.5h58.2l8.7-67.6h-67v-43.2c0-19.6 5.4-32.9 33.5-32.9h35.8v-60.5c-6.2-.8-27.4-2.7-52.2-2.7-51.6 0-87 31.5-87 89.4v49.9h-58.4v67.6h58.4V480H24.7C11.1 480 0 468.9 0 455.3V56.7C0 43.1 11.1 32 24.7 32h398.5c13.7 0 24.8 11.1 24.8 24.7z");
    			attr_dev(path0, "class", "");
    			add_location(path0, file$7, 20, 5, 681);
    			attr_dev(svg0, "aria-hidden", "true");
    			attr_dev(svg0, "data-prefix", "fab");
    			attr_dev(svg0, "data-icon", "facebook");
    			attr_dev(svg0, "role", "img");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 448 512");
    			attr_dev(svg0, "class", "icon svg-inline--fa fa-facebook fa-w-14");
    			attr_dev(svg0, "width", "50px");
    			attr_dev(svg0, "height", "49px");
    			set_style(svg0, "color", "rgb(59, 89, 152)");
    			add_location(svg0, file$7, 19, 4, 436);
    			attr_dev(h22, "class", "svelte-1akomx2");
    			add_location(h22, file$7, 23, 4, 1031);
    			attr_dev(p0, "class", "button_Description");
    			add_location(p0, file$7, 26, 4, 1073);
    			attr_dev(p1, "class", "button_Description");
    			add_location(p1, file$7, 29, 4, 1153);
    			attr_dev(div0, "class", "button-container svelte-1akomx2");
    			add_location(div0, file$7, 18, 3, 401);
    			attr_dev(a0, "href", "https://www.facebook.com/groups/cppkorea/");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "col-sm shadow-button svelte-1akomx2");
    			add_location(a0, file$7, 17, 2, 299);
    			attr_dev(div1, "class", "LinkButton");
    			add_location(div1, file$7, 16, 1, 272);
    			attr_dev(path1, "fill", "currentColor");
    			attr_dev(path1, "d", "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z");
    			attr_dev(path1, "class", "");
    			add_location(path1, file$7, 40, 5, 1650);
    			attr_dev(svg1, "aria-hidden", "true");
    			attr_dev(svg1, "data-prefix", "fab");
    			attr_dev(svg1, "data-icon", "github");
    			attr_dev(svg1, "role", "img");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 496 512");
    			attr_dev(svg1, "class", "icon svg-inline--fa fa-github fa-w-16");
    			attr_dev(svg1, "width", "50px");
    			attr_dev(svg1, "height", "49px");
    			attr_dev(svg1, "color", "#000");
    			add_location(svg1, file$7, 39, 4, 1428);
    			attr_dev(h23, "class", "svelte-1akomx2");
    			add_location(h23, file$7, 43, 4, 3023);
    			attr_dev(p2, "class", "button_Description");
    			add_location(p2, file$7, 46, 4, 3068);
    			attr_dev(p3, "class", "button_Description");
    			add_location(p3, file$7, 49, 4, 3144);
    			attr_dev(p4, "class", "button_Description");
    			add_location(p4, file$7, 52, 4, 3219);
    			attr_dev(div2, "class", "button-container svelte-1akomx2");
    			add_location(div2, file$7, 38, 3, 1393);
    			attr_dev(a1, "href", "https://github.com/cppkorea");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "col-sm shadow-button svelte-1akomx2");
    			add_location(a1, file$7, 37, 2, 1305);
    			attr_dev(div3, "class", "LinkButton");
    			add_location(div3, file$7, 36, 1, 1278);
    			attr_dev(main, "class", "svelte-1akomx2");
    			add_location(main, file$7, 4, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h20);
    			append_dev(h20, t2);
    			append_dev(h20, br);
    			append_dev(h20, t3);
    			append_dev(main, t4);
    			append_dev(main, h21);
    			append_dev(main, t6);
    			append_dev(main, div1);
    			append_dev(div1, a0);
    			append_dev(a0, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t7);
    			append_dev(div0, h22);
    			append_dev(div0, t9);
    			append_dev(div0, p0);
    			append_dev(div0, t11);
    			append_dev(div0, p1);
    			append_dev(div0, t13);
    			append_dev(main, t14);
    			append_dev(main, div3);
    			append_dev(div3, a1);
    			append_dev(a1, div2);
    			append_dev(div2, svg1);
    			append_dev(svg1, path1);
    			append_dev(div2, t15);
    			append_dev(div2, h23);
    			append_dev(div2, t17);
    			append_dev(div2, p2);
    			append_dev(div2, t19);
    			append_dev(div2, p3);
    			append_dev(div2, t21);
    			append_dev(div2, p4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Pages/Project.svelte generated by Svelte v3.47.0 */

    const file$6 = "src/Pages/Project.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let br2;
    	let t5;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Project";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text("비영리 단체로의 변화\n\t\t");
    			br0 = element("br");
    			t3 = text("\n\t\tCoC 정립\n\t\t");
    			br1 = element("br");
    			t4 = text("\n    \tC++ 핵심 가이드라인 한글화 프로젝트\n\t\t");
    			br2 = element("br");
    			t5 = text("\n\t\t팟 캐스트 발신");
    			attr_dev(h1, "class", "svelte-1fd2bca");
    			add_location(h1, file$6, 5, 4, 42);
    			add_location(br0, file$6, 10, 2, 95);
    			add_location(br1, file$6, 12, 2, 111);
    			add_location(br2, file$6, 14, 2, 145);
    			add_location(h2, file$6, 8, 4, 74);
    			attr_dev(main, "class", "svelte-1fd2bca");
    			add_location(main, file$6, 4, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(h2, t2);
    			append_dev(h2, br0);
    			append_dev(h2, t3);
    			append_dev(h2, br1);
    			append_dev(h2, t4);
    			append_dev(h2, br2);
    			append_dev(h2, t5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Project', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Project> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Project extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Project",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Pages/Conference.svelte generated by Svelte v3.47.0 */

    const file$5 = "src/Pages/Conference.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Conference";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "코로나로 인해 모임이 어려웠던 관계로 검토가 진행중입니다.\n        변경사항이 생기는대로 다시 공지 드리겠습니다.";
    			attr_dev(h1, "class", "svelte-1fd2bca");
    			add_location(h1, file$5, 5, 4, 42);
    			add_location(h2, file$5, 8, 4, 80);
    			attr_dev(main, "class", "svelte-1fd2bca");
    			add_location(main, file$5, 4, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Conference', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Conference> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Conference extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Conference",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Pages/Study.svelte generated by Svelte v3.47.0 */

    const file$4 = "src/Pages/Study.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p;
    	let t4;
    	let br;
    	let t5;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Study";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "2022년 상반기 스터디는 모두 종료되었습니다.";
    			t3 = space();
    			p = element("p");
    			t4 = text("Lage Scale C++\n\t\t");
    			br = element("br");
    			t5 = text("\n\t\tPractical C++");
    			attr_dev(h1, "class", "svelte-1fd2bca");
    			add_location(h1, file$4, 5, 4, 42);
    			add_location(h2, file$4, 8, 1, 72);
    			add_location(br, file$4, 13, 2, 137);
    			add_location(p, file$4, 11, 1, 114);
    			attr_dev(main, "class", "svelte-1fd2bca");
    			add_location(main, file$4, 4, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, t4);
    			append_dev(p, br);
    			append_dev(p, t5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Study', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Study> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Study extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Study",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Pages/CppGuideline.svelte generated by Svelte v3.47.0 */

    const file$3 = "src/Pages/CppGuideline.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let a;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "CppGuideline";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "C++ 표준 위원회에서 제작한 C++핵심 가이드라인을 한글화하는 프로젝트를 진행하고 있습니다.";
    			t3 = space();
    			a = element("a");
    			a.textContent = "자세히 보기";
    			attr_dev(h1, "class", "svelte-1fd2bca");
    			add_location(h1, file$3, 5, 4, 42);
    			add_location(h2, file$3, 8, 1, 79);
    			attr_dev(a, "href", "https://github.com/CppKorea/CppCoreGuidelines");
    			add_location(a, file$3, 11, 1, 147);
    			attr_dev(main, "class", "svelte-1fd2bca");
    			add_location(main, file$3, 4, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			append_dev(main, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CppGuideline', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CppGuideline> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CppGuideline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CppGuideline",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Pages/Bug.svelte generated by Svelte v3.47.0 */

    const file$2 = "src/Pages/Bug.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "예기치 못한 동작이 있었습니다.";
    			t1 = space();
    			p = element("p");
    			p.textContent = "이 페이지를 발견하신 분 께서는 재현 절차를 github issue에 등록 부탁드립니다.";
    			attr_dev(h1, "class", "svelte-1fd2bca");
    			add_location(h1, file$2, 5, 4, 42);
    			add_location(p, file$2, 8, 4, 87);
    			attr_dev(main, "class", "svelte-1fd2bca");
    			add_location(main, file$2, 4, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Bug', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Bug> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Bug extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bug",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Dashboard/Footer.svelte generated by Svelte v3.47.0 */

    const file$1 = "src/Dashboard/Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let p;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let br4;
    	let t5;
    	let t6;
    	let div;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			p = element("p");
    			t0 = text("C++ Korea\n        ");
    			br0 = element("br");
    			t1 = text("\n        C++ Korea Meta(Facebook) Group\n        ");
    			br1 = element("br");
    			t2 = space();
    			br2 = element("br");
    			t3 = text("\n        C++ Korea Github : github.com/cppkorea\n        ");
    			br3 = element("br");
    			t4 = text("\n        C++ Korea Meta(Facebook) Group : fb.com/groups/cppkorea\n        ");
    			br4 = element("br");
    			t5 = text("\n        Contrect us : contact@cppkorea.org");
    			t6 = space();
    			div = element("div");
    			div.textContent = "ⓒ 2018. C++ Korea Organization. All rights reserved.";
    			add_location(br0, file$1, 3, 8, 43);
    			add_location(br1, file$1, 5, 8, 95);
    			add_location(br2, file$1, 6, 8, 108);
    			add_location(br3, file$1, 8, 8, 168);
    			add_location(br4, file$1, 10, 8, 245);
    			attr_dev(p, "class", "svelte-1huwrrm");
    			add_location(p, file$1, 1, 4, 13);
    			attr_dev(div, "class", "copyright svelte-1huwrrm");
    			add_location(div, file$1, 13, 1, 303);
    			attr_dev(footer, "class", "svelte-1huwrrm");
    			add_location(footer, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);
    			append_dev(p, t0);
    			append_dev(p, br0);
    			append_dev(p, t1);
    			append_dev(p, br1);
    			append_dev(p, t2);
    			append_dev(p, br2);
    			append_dev(p, t3);
    			append_dev(p, br3);
    			append_dev(p, t4);
    			append_dev(p, br4);
    			append_dev(p, t5);
    			append_dev(footer, t6);
    			append_dev(footer, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Dashboard/Dashboard.svelte generated by Svelte v3.47.0 */
    const file = "src/Dashboard/Dashboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (37:5) {#each menulist as menuunit, i}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*menuunit*/ ctx[1] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*i*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-1a3kt7q");
    			add_location(a, file, 38, 7, 1100);
    			attr_dev(li, "class", "svelte-1a3kt7q");
    			toggle_class(li, "focus", /*pos*/ ctx[3] === /*i*/ ctx[8]);
    			add_location(li, file, 37, 6, 1064);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pos*/ 8) {
    				toggle_class(li, "focus", /*pos*/ ctx[3] === /*i*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(37:5) {#each menulist as menuunit, i}",
    		ctx
    	});

    	return block;
    }

    // (61:1) {:else}
    function create_else_block(ctx) {
    	let bug;
    	let current;
    	bug = new Bug({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bug.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bug, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bug.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bug.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bug, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(61:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:22) 
    function create_if_block_5(ctx) {
    	let cppguideline;
    	let current;
    	cppguideline = new CppGuideline({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(cppguideline.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cppguideline, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cppguideline.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cppguideline.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cppguideline, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(59:22) ",
    		ctx
    	});

    	return block;
    }

    // (57:22) 
    function create_if_block_4(ctx) {
    	let study;
    	let current;
    	study = new Study({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(study.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(study, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(study.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(study.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(study, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(57:22) ",
    		ctx
    	});

    	return block;
    }

    // (55:22) 
    function create_if_block_3(ctx) {
    	let conference;
    	let current;
    	conference = new Conference({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(conference.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(conference, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(conference.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(conference.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(conference, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(55:22) ",
    		ctx
    	});

    	return block;
    }

    // (53:22) 
    function create_if_block_2(ctx) {
    	let project;
    	let current;
    	project = new Project({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(project.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(project, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(project.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(project.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(project, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(53:22) ",
    		ctx
    	});

    	return block;
    }

    // (51:22) 
    function create_if_block_1(ctx) {
    	let about;
    	let current;
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(51:22) ",
    		ctx
    	});

    	return block;
    }

    // (49:1) {#if menu === 0}
    function create_if_block(ctx) {
    	let main;
    	let current;
    	main = new Main({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(main.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(main, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(main.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(main.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(main, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(49:1) {#if menu === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let div4;
    	let img;
    	let img_src_value;
    	let t1;
    	let div1;
    	let table;
    	let tr0;
    	let t3;
    	let tr1;
    	let t5;
    	let div3;
    	let div2;
    	let ul;
    	let t6;
    	let current_block_type_index;
    	let if_block;
    	let t7;
    	let footer;
    	let current;
    	let each_value = /*menulist*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*menu*/ ctx[0] === 0) return 0;
    		if (/*menu*/ ctx[0] === 1) return 1;
    		if (/*menu*/ ctx[0] === 2) return 2;
    		if (/*menu*/ ctx[0] === 3) return 3;
    		if (/*menu*/ ctx[0] === 4) return 4;
    		if (/*menu*/ ctx[0] === 5) return 5;
    		return 6;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			img = element("img");
    			t1 = space();
    			div1 = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			tr0.textContent = "C++ Korea";
    			t3 = space();
    			tr1 = element("tr");
    			tr1.textContent = "C++ Korea Facebook Group";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			if_block.c();
    			t7 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div0, "class", "overlay-back svelte-1a3kt7q");
    			add_location(div0, file, 19, 1, 595);
    			if (!src_url_equal(img.src, img_src_value = /*logo*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "cppkorea Logo");
    			attr_dev(img, "height", "45");
    			attr_dev(img, "width", "44");
    			add_location(img, file, 22, 2, 680);
    			attr_dev(tr0, "class", "GroupName svelte-1a3kt7q");
    			add_location(tr0, file, 25, 4, 805);
    			attr_dev(tr1, "class", "MetaName svelte-1a3kt7q");
    			add_location(tr1, file, 28, 4, 857);
    			attr_dev(table, "class", "Namesaaa");
    			add_location(table, file, 24, 3, 776);
    			attr_dev(div1, "class", "GroupIconNames svelte-1a3kt7q");
    			add_location(div1, file, 23, 2, 744);
    			attr_dev(ul, "class", "svelte-1a3kt7q");
    			add_location(ul, file, 35, 4, 995);
    			attr_dev(div2, "class", "menuunit svelte-1a3kt7q");
    			add_location(div2, file, 34, 3, 968);
    			attr_dev(div3, "class", "menulist svelte-1a3kt7q");
    			add_location(div3, file, 33, 2, 942);
    			attr_dev(div4, "class", "MenuTable svelte-1a3kt7q");
    			attr_dev(div4, "id", "menu");
    			attr_dev(div4, "width", "100%");
    			add_location(div4, file, 21, 1, 631);
    			attr_dev(main, "class", "svelte-1a3kt7q");
    			add_location(main, file, 18, 0, 587);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(main, t0);
    			append_dev(main, div4);
    			append_dev(div4, img);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, table);
    			append_dev(table, tr0);
    			append_dev(table, t3);
    			append_dev(table, tr1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			/*ul_binding*/ ctx[6](ul);
    			append_dev(main, t6);
    			if_blocks[current_block_type_index].m(main, null);
    			insert_dev(target, t7, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*logo*/ 4 && !src_url_equal(img.src, img_src_value = /*logo*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*pos, menu, menulist*/ 25) {
    				each_value = /*menulist*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			/*ul_binding*/ ctx[6](null);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t7);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dashboard', slots, []);
    	let { logo } = $$props;
    	let { menu } = $$props;
    	let { pos } = $$props;
    	let { menuunit } = $$props;
    	const menulist = ['Main', 'About', 'Project', 'Conference', 'Study', 'CppGuideline'];
    	const writable_props = ['logo', 'menu', 'pos', 'menuunit'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => $$invalidate(0, menu = i);

    	function ul_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			menuunit = $$value;
    			$$invalidate(1, menuunit);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('logo' in $$props) $$invalidate(2, logo = $$props.logo);
    		if ('menu' in $$props) $$invalidate(0, menu = $$props.menu);
    		if ('pos' in $$props) $$invalidate(3, pos = $$props.pos);
    		if ('menuunit' in $$props) $$invalidate(1, menuunit = $$props.menuunit);
    	};

    	$$self.$capture_state = () => ({
    		Main,
    		About,
    		Project,
    		Conference,
    		Study,
    		CppGuideline,
    		Bug,
    		Footer,
    		logo,
    		menu,
    		pos,
    		menuunit,
    		menulist
    	});

    	$$self.$inject_state = $$props => {
    		if ('logo' in $$props) $$invalidate(2, logo = $$props.logo);
    		if ('menu' in $$props) $$invalidate(0, menu = $$props.menu);
    		if ('pos' in $$props) $$invalidate(3, pos = $$props.pos);
    		if ('menuunit' in $$props) $$invalidate(1, menuunit = $$props.menuunit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menu, menuunit, logo, pos, menulist, click_handler, ul_binding];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { logo: 2, menu: 0, pos: 3, menuunit: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*logo*/ ctx[2] === undefined && !('logo' in props)) {
    			console.warn("<Dashboard> was created without expected prop 'logo'");
    		}

    		if (/*menu*/ ctx[0] === undefined && !('menu' in props)) {
    			console.warn("<Dashboard> was created without expected prop 'menu'");
    		}

    		if (/*pos*/ ctx[3] === undefined && !('pos' in props)) {
    			console.warn("<Dashboard> was created without expected prop 'pos'");
    		}

    		if (/*menuunit*/ ctx[1] === undefined && !('menuunit' in props)) {
    			console.warn("<Dashboard> was created without expected prop 'menuunit'");
    		}
    	}

    	get logo() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logo(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get menu() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menu(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pos() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pos(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get menuunit() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menuunit(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const dashboard = new Dashboard({
    	target: document.body,
    	props: {
    		menu: 0
    		, logo: './Resource/Image/cppkorea_logo_iso.5dc1bc2fb595e64a75ece0326032d823.png'
    	}
    });

    return dashboard;

})();
//# sourceMappingURL=bundle.js.map
