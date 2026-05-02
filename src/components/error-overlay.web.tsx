/**
 * Web no-op for StartupErrorOverlay.
 *
 * On web, the browser console + dev tools already surface unhandled errors,
 * so we don't need a custom overlay. This file mirrors the .tsx export shape
 * to keep the resolver happy.
 */

import React from 'react';

export class StartupErrorOverlay extends React.Component<React.PropsWithChildren> {
  render() {
    return this.props.children;
  }
}
