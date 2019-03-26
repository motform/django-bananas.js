import fetchMock from "fetch-mock";
import Logger from "js-logger";
import React from "react";
import { cleanup, fireEvent, render, wait } from "react-testing-library";

import { AutoField, Form } from "../../src/forms";
import getAPIClient from "../api.mock";
import { TestContext } from "./utils";

Logger.get("bananas").setLevel(Logger.OFF);

afterEach(cleanup);

test("Ensure the default 'onSubmit' is firing a correct request", async () => {
  const api = await getAPIClient();
  const success = jest.fn();
  const { getByText } = render(
    <TestContext api={api} admin={{ success }}>
      <Form route="example.user:form.create" initialValues={{ text: "foo" }}>
        <AutoField name="text" />
        <button type="submit">Submit</button>
      </Form>
    </TestContext>
  );
  const button = getByText("Submit");
  const matcher = "http://foo.bar/api/v1.0/example/user/form/";
  fetchMock.post(matcher, { body: { text: "foo" } });
  fireEvent.click(button);
  await wait(() => success.calls);
  expect(success).toHaveBeenCalledWith("Changes have been saved!");
  expect(fetchMock.called(matcher)).toBe(true);
});

test("Ensure the default 'onSubmit' can handle errors", async () => {
  const api = await getAPIClient();
  const error = jest.fn();
  const { getByText } = render(
    <TestContext api={api} admin={{ error }}>
      <Form route="example.user:form.create" initialValues={{ text: "foo" }}>
        <AutoField name="text" />
        <button type="submit">Submit</button>
      </Form>
    </TestContext>
  );
  const button = getByText("Submit");
  const matcher = "http://foo.bar/api/v1.0/example/user/form/";
  fetchMock.post(matcher, { body: { text: "Invalid text" }, status: 400 });
  fireEvent.click(button);
  await wait(() => error.calls);
  expect(error).toHaveBeenCalledWith("Please correct the errors on this form.");
  expect(fetchMock.called(matcher)).toBe(true);
});

test("Ensure custom 'onSubmit' is called", async () => {
  const api = await getAPIClient();
  const onSubmit = jest.fn();
  const { getByText } = render(
    <TestContext api={api}>
      <Form
        route="example.user:form.create"
        initialValues={{ text: "foo" }}
        onSubmit={onSubmit}
      >
        <AutoField name="text" />
        <button type="submit">Submit</button>
      </Form>
    </TestContext>
  );
  const button = getByText("Submit");
  fireEvent.click(button);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(typeof onSubmit.mock.calls[0][0].endpoint).toBe("function");
  expect(onSubmit.mock.calls[0][0].values).toMatchObject({ text: "foo" });
});
