'use client';

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {

  console.log('code-block: inline:', inline);

  if (false) {
    return (
      <code
        {...props}
        className={`block text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900 whitespace-pre-wrap break-words ${className || ''}`}
      >
        {children}
      </code>
    );
  } else {
    console.log('code-block: inline, children:', { inline, children });
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800  py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
