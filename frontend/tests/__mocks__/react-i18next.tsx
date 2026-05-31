const React = require("react");

const useMock = ((k: string) => k) as unknown;
const useTranslation = () => {
  return {
    t: useMock,
    i18n: {
      changeLanguage: jest.fn(),
      language: "ja",
    },
  };
};

const Trans = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

const initReactI18next = { type: "3rdParty", init: jest.fn() };

module.exports = {
  useTranslation,
  Trans,
  initReactI18next,
};
