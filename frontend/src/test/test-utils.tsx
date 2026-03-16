import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { TooltipProvider } from '@/components/ui/tooltip';

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

function AllProviders({
  children,
  queryClient = createTestQueryClient(),
  routerProps = {},
}: AllProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <MemoryRouter {...routerProps}>{children}</MemoryRouter>
        </TooltipProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

function customRender(
  ui: ReactElement,
  {
    queryClient,
    routerProps,
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient} routerProps={routerProps}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { customRender as render, AllProviders, createTestQueryClient };
