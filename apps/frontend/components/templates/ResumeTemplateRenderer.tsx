"use client";

import type { TemplateProps } from "./TemplateOne";
import TemplateOne from "./TemplateOne";
import TemplateTwo from "./TemplateTwo";
import TemplateThree from "./TemplateThree";
import TemplateFour from "./TemplateFour";
import TemplateFive from "./TemplateFive";
import TemplateSix from "./TemplateSix";
import TemplateSeven from "./TemplateSeven";
import TemplateEight from "./TemplateEight";
import TemplateNine from "./TemplateNine";
import TemplateTen from "./TemplateTen";

export function ResumeTemplateRenderer({
  templateId,
  ...props
}: TemplateProps & { templateId: string }) {
  switch (templateId) {
    case "2": return <TemplateTwo {...props} />;
    case "3": return <TemplateThree {...props} />;
    case "4": return <TemplateFour {...props} />;
    case "5": return <TemplateFive {...props} />;
    case "6": return <TemplateSix {...props} />;
    case "7": return <TemplateSeven {...props} />;
    case "8": return <TemplateEight {...props} />;
    case "9": return <TemplateNine {...props} />;
    case "10": return <TemplateTen {...props} />;
    default: return <TemplateOne {...props} />;
  }
}
