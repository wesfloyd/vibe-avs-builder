'use client';

import React from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor
} from '@codesandbox/sandpack-react';



// Named export for use in the layout
export function SandpackSidebar() {
  return (
    <div className="h-svh border-l border-sidebar-border bg-sidebar flex-shrink-0 w-1/2 min-w-[240px] relative overflow-y-auto">
      <div className="sticky top-0 bg-sidebar z-10">
        <div className="p-2 border-b border-sidebar-border">
          <h2 className="text-lg font-medium px-2">Files</h2>
        </div>
      </div>
      <div className="flex flex-col h-[calc(100%-49px)]">
        <SandpackProvider template="react"
        files={{
            "/wes.js": `export default function App() {
      return <h1>Hello Sandpack</h1>
    }`,
          }}>
          <SandpackLayout>
            <SandpackFileExplorer />
            <SandpackCodeEditor />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
