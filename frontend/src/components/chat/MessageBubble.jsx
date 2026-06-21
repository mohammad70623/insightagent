import React, { useState } from "react";

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <div className="my-3 border border-gray-800 rounded-lg overflow-hidden bg-black/40 shadow-inner max-w-full">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-900/60 border-b border-gray-800/80 text-xs text-gray-400 font-sans select-none">
        <span className="font-mono text-gray-500 text-[11px] tracking-wider uppercase">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.078a1.125 1.125 0 011.66 0l2.197 2.197a1.125 1.125 0 010 1.66L17.25 13.5m-3.577-3.577L15.75 7.875m-3.577 3.577a1.125 1.125 0 001.66 0l2.197-2.197a1.125 1.125 0 000-1.66L12.173 4.148a1.125 1.125 0 00-1.66 0L8.316 6.345" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-[13px] text-gray-200 leading-relaxed custom-scrollbar whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderStructuredMarkdown = (text, isUser) => {
  if (!text) return "";

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  const parseInline = (inlineText) => {
    if (!inlineText) return "";

    // Split by inline code: `code`
    const codeParts = inlineText.split(/(`[^`]+?`)/g);
    return codeParts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        const codeContent = part.slice(1, -1);
        return (
          <code
            key={idx}
            className={`font-mono px-1.5 py-0.5 rounded text-[12px] mx-0.5 select-all ${
              isUser
                ? "bg-sky-500/20 border border-sky-400/20 text-sky-950 font-semibold"
                : "bg-gray-950/60 border border-gray-800 text-pink-400"
            }`}
          >
            {codeContent}
          </code>
        );
      }

      // Split by bold: **bold**
      const boldParts = part.split(/(\*\*[^*]+?\*\*)/g);
      return boldParts.map((subPart, subIdx) => {
        if (subPart.startsWith("**") && subPart.endsWith("**")) {
          const boldContent = subPart.slice(2, -2);
          return (
            <strong
              key={subIdx}
              className={`font-bold ${
                isUser ? "text-gray-950 font-extrabold" : "text-[#38bdf8]"
              }`}
            >
              {boldContent}
            </strong>
          );
        }
        return subPart;
      });
    });
  };

  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      // Extract code block language & content
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : "";
      const code = match ? match[2] : part.slice(3, -3);
      return <CodeBlock key={index} code={code} language={language} />;
    }

    // Process normal text block
    const lines = part.split("\n");
    const elements = [];
    let currentList = null; 
    let listItems = [];

    const flushList = (key) => {
      if (currentList && listItems.length > 0) {
        const items = [...listItems];
        listItems = [];
        const type = currentList;
        currentList = null;
        
        const listClassName = `pl-6 my-2 space-y-1 list-outside ${
          isUser ? "text-gray-900" : "text-gray-200"
        }`;

        if (type === "ul") {
          elements.push(
            <ul key={key} className={`list-disc ${listClassName}`}>
              {items.map((it, i) => (
                <li key={i} className="whitespace-pre-wrap">{parseInline(it)}</li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol key={key} className={`list-decimal ${listClassName}`}>
              {items.map((it, i) => (
                <li key={i} className="whitespace-pre-wrap">{parseInline(it)}</li>
              ))}
            </ol>
          );
        }
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

      if (bulletMatch) {
        const content = bulletMatch[2];
        if (currentList !== "ul") {
          flushList(`list-flush-${i}`);
          currentList = "ul";
        }
        listItems.push(content);
      } else if (numberMatch) {
        const content = numberMatch[2];
        if (currentList !== "ol") {
          flushList(`list-flush-${i}`);
          currentList = "ol";
        }
        listItems.push(content);
      } else {
        flushList(`list-flush-${i}`);
        if (line.trim() === "") {
          elements.push(<div key={`empty-${i}`} className="h-2" />);
        } else {
          elements.push(
            <p
              key={`p-${i}`}
              className={`my-1.5 leading-relaxed whitespace-pre-wrap ${
                isUser ? "text-gray-900" : "text-gray-200"
              }`}
            >
              {parseInline(line)}
            </p>
          );
        }
      }
    }
    flushList(`list-flush-end-${index}`);
    return <React.Fragment key={index}>{elements}</React.Fragment>;
  });
};

const MessageBubble = ({ msg, isStreaming, isLast }) => {
  const isUser = msg.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-md leading-relaxed break-words overflow-hidden ${
          isUser
            ? "bg-[#38bdf8] text-gray-900 rounded-tr-none font-medium font-sans"
            : "bg-[#1f2937] text-gray-100 border border-gray-700 rounded-tl-none font-mono"
        }`}
      >
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-1.5 font-sans select-none">
          {isUser ? "👨‍💻 USER_PROMPT" : "🤖 LLaMA_STREAM_AGENT"}
        </p>
        
        {/* 💡 structured render and responsive structure */}
        <div className="text-left tracking-wide">
          {renderStructuredMarkdown(msg.content, isUser)}
          {isStreaming && isLast && (
            <span className="inline-block ml-1 animate-pulse font-sans text-[#38bdf8]">▋</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;