import type { Preview } from "@storybook/react";
import "../src/app/globals.css";
import { withRouter } from "./routerDecorator";

const preview: Preview = {
  decorators: [withRouter],
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
