/*
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import WatchGroup from './watch-group.js';
import ArcsUtils from "../lib/arcs-utils.js";
import XenBase from "../../components/xen/xen-base.js";

class PersistentArc extends XenBase {
  static get observedAttributes() { return ['key','metadata']; }
  _getInitialState() {
    return {
      watch: new WatchGroup(),
      db: db.child('arcs')
    };
  }
  // Allow overriding search params for unit tests.
  _getSearchParams() {
    return (new URL(document.location)).searchParams;
  }
  _getExternalManifest() {
    const params = this._getSearchParams();
    // Prioritize manifest over solo, semi-arbitrarily, since usually we'll
    // only see one or the other.
    return params.get('solo') || params.get('manifest');
  }
  _update(props, state, lastProps) {
    if (props.key === '*' && lastProps.key != props.key) {
      this._createKey(state.db);
    }
    if (props.key && props.key !== '*') {
      if (props.metadata) {
        // Typical developer workflow involves creating a new arc and
        // subsequently modifying the url to include a specific recipe via a
        // solo or manifest query param, thus we have to look for such a param
        // at arc update time. Alternatively we could have the developer
        // include the param in the main launcher page and have the app shell
        // pass it along to the 'New Arc' url, but that is not the current
        // state of the world.
        props.metadata['externalManifest'] = this._getExternalManifest();
        if (props.metadata !== state.metadata) {
          state.metadata = props.metadata;
          let arcMetadata = state.db.child(props.key).child('metadata');
          PersistentArc.log('WRITING (update) metadata for', String(arcMetadata), props.metadata);
          arcMetadata.update(props.metadata);
        }
      }
      if (props.key !== lastProps.key) {
        state.watch.watches = [this._watchKey(state.db, props.key)];
      }
    }
  }
  _createKey(db) {
    let icons = ['settings','movie','new_releases','high_quality','room_service','casino','child_care','spa','kitchen'];
    let colors = ['darkred','darkblue','darkgreen','darkorange','black'];
    let data = {
      description: ArcsUtils.randomName(),
      icon: icons[Math.floor(Math.random()*icons.length)],
      color: colors[Math.floor(Math.random()*colors.length)],
      externalManifest: this._getExternalManifest()
    };
    let key = db.push({'metadata': data}).key;
    this._setState({key});
    PersistentArc.log('providing key (_createKey)', key);
    this._fire('key', key);
  }
  _watchKey(db, key) {
    let arcMetadata = db.child(key).child('metadata');
    PersistentArc.log('watching', String(arcMetadata));
    return {
      node: arcMetadata,
      handler: snap => {
        let metadata = snap.val();
        this._setState({metadata});
        PersistentArc.log('remoteChanged', metadata);
        this._fire('metadata', metadata);
      }
    };
  }
}
PersistentArc.log = XenBase.logFactory('PersistentArc', '#a30000');
customElements.define('persistent-arc', PersistentArc);
