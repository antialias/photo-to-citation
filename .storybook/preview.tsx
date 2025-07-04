import type { Decorator, Preview } from "@storybook/react";
import "../src/app/globals.css";
import QueryProvider from "../src/app/query-provider";
import { withRouter } from "./routerDecorator";

const withQueryProvider: Decorator = (Story) => {
  const StoryComponent = Story as unknown as React.FC;
  return (
    <QueryProvider>
      <StoryComponent />
    </QueryProvider>
  );
};

const preview: Preview = {
  decorators: [withRouter, withQueryProvider],
  parameters: {
    actions: { argTypesRegex: "^on.*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
