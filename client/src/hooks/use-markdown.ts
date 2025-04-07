import { useMemo } from "react";

export function useMarkdown() {
  const renderMarkdown = useMemo(() => {
    return (markdown: string) => {
      // This is a very simple markdown renderer for demo purposes
      // In a real app, you would use a library like marked or remark
      
      if (!markdown) return "";
      
      // Replace headings
      let html = markdown
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>');
      
      // Replace bold, italic, underline
      html = html
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/__(.*?)__/gim, '<u>$1</u>');
      
      // Replace lists
      html = html
        .replace(/^\s*- (.*$)/gim, '<li class="ml-5">$1</li>')
        .replace(/^\s*\d+\. (.*$)/gim, '<li class="ml-5 list-decimal">$1</li>')
        .replace(/^\s*- \[ \] (.*$)/gim, '<li class="ml-5 flex items-start"><input type="checkbox" class="mr-2 mt-1" />$1</li>')
        .replace(/^\s*- \[x\] (.*$)/gim, '<li class="ml-5 flex items-start"><input type="checkbox" checked class="mr-2 mt-1" />$1</li>');
      
      // Wrap adjacent list items in <ul> tags
      const lines = html.split('\n');
      let inList = false;
      let listType = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('<li class="ml-5">')) {
          if (!inList || listType !== 'ul') {
            if (inList) lines[i-1] += '</ul>';
            lines[i] = '<ul class="list-disc mb-4">' + line;
            inList = true;
            listType = 'ul';
          }
        } else if (line.includes('<li class="ml-5 list-decimal">')) {
          if (!inList || listType !== 'ol') {
            if (inList) lines[i-1] += '</ul>';
            lines[i] = '<ol class="list-decimal mb-4">' + line;
            inList = true;
            listType = 'ol';
          }
        } else if (line.includes('<li class="ml-5 flex items-start">')) {
          if (!inList || listType !== 'checklist') {
            if (inList) lines[i-1] += '</ul>';
            lines[i] = '<ul class="mb-4">' + line;
            inList = true;
            listType = 'checklist';
          }
        } else {
          if (inList) {
            lines[i-1] += '</ul>';
            inList = false;
          }
        }
      }
      
      if (inList) {
        lines[lines.length-1] += '</ul>';
      }
      
      html = lines.join('\n');
      
      // Replace links and images
      html = html
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary underline">$1</a>')
        .replace(/!\[([^\]]+)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full rounded my-2" />');
      
      // Replace paragraphs (must be done last)
      html = html
        .replace(/^([^<].*)\n$/gim, '<p class="mb-4">$1</p>')
        .replace(/<\/ul>\n<p class="mb-4">/gim, '</ul><p class="mb-4">')
        .replace(/<\/ol>\n<p class="mb-4">/gim, '</ol><p class="mb-4">');
      
      // Return HTML string to be rendered
      return html;
    };
  }, []);

  return { renderMarkdown };
}
