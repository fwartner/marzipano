interface CodeBlockProps {
  children: string;
  language?: string;
}

export default function CodeBlock({ children, language = 'javascript' }: CodeBlockProps) {
  // Trim leading/trailing whitespace and normalize line breaks
  const code = children.trim();
  
  return (
    <div className="relative">
      <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-700">
        <code className={`font-mono text-sm text-gray-100 whitespace-pre ${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}

