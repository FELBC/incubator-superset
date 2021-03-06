/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Alert, ProgressBar } from 'react-bootstrap';

import FilterableTable from 'src/components/FilterableTable/FilterableTable';
import ExploreResultsButton from 'src/SqlLab/components/ExploreResultsButton';
import ResultSet from 'src/SqlLab/components/ResultSet';
import ErrorMessageWithStackTrace from 'src/components/ErrorMessage/ErrorMessageWithStackTrace';
import {
  cachedQuery,
  failedQueryWithErrorMessage,
  failedQueryWithErrors,
  queries,
  runningQuery,
  stoppedQuery,
} from './fixtures';

describe('ResultSet', () => {
  const clearQuerySpy = sinon.spy();
  const fetchQuerySpy = sinon.spy();
  const mockedProps = {
    actions: {
      clearQueryResults: clearQuerySpy,
      fetchQueryResults: fetchQuerySpy,
    },
    cache: true,
    query: queries[0],
    height: 0,
    database: { allows_virtual_table_explore: true },
  };
  const stoppedQueryProps = { ...mockedProps, query: stoppedQuery };
  const runningQueryProps = { ...mockedProps, query: runningQuery };
  const cachedQueryProps = { ...mockedProps, query: cachedQuery };
  const failedQueryWithErrorMessageProps = {
    ...mockedProps,
    query: failedQueryWithErrorMessage,
  };
  const failedQueryWithErrorsProps = {
    ...mockedProps,
    query: failedQueryWithErrors,
  };
  const newProps = {
    query: {
      cached: false,
      resultsKey: 'new key',
      results: {
        data: [{ a: 1 }],
      },
    },
  };

  it('is valid', () => {
    expect(React.isValidElement(<ResultSet {...mockedProps} />)).toBe(true);
  });
  it('renders a Table', () => {
    const wrapper = shallow(<ResultSet {...mockedProps} />);
    expect(wrapper.find(FilterableTable)).toExist();
  });
  describe('componentWillReceiveProps', () => {
    const wrapper = shallow(<ResultSet {...mockedProps} />);
    let spy;
    beforeEach(() => {
      clearQuerySpy.resetHistory();
      fetchQuerySpy.resetHistory();
      spy = sinon.spy(ResultSet.prototype, 'UNSAFE_componentWillReceiveProps');
    });
    afterEach(() => {
      spy.restore();
    });
    it('should update cached data', () => {
      wrapper.setProps(newProps);

      expect(wrapper.state().data).toEqual(newProps.query.results.data);
      expect(clearQuerySpy.callCount).toBe(1);
      expect(clearQuerySpy.getCall(0).args[0]).toEqual(newProps.query);
      expect(fetchQuerySpy.callCount).toBe(1);
      expect(fetchQuerySpy.getCall(0).args[0]).toEqual(newProps.query);
    });
  });
  describe('render', () => {
    it('should render success query', () => {
      const wrapper = shallow(<ResultSet {...mockedProps} />);
      const filterableTable = wrapper.find(FilterableTable);
      expect(filterableTable.props().data).toBe(mockedProps.query.results.data);
      expect(wrapper.find(ExploreResultsButton)).toExist();
    });
    it('should render empty results', () => {
      const wrapper = shallow(<ResultSet {...mockedProps} />);
      const emptyResults = {
        ...queries[0],
        results: {
          data: [],
        },
      };
      wrapper.setProps({ query: emptyResults });
      expect(wrapper.find(FilterableTable)).not.toExist();
      expect(wrapper.find(Alert)).toExist();
      expect(wrapper.find(Alert).shallow().text()).toBe(
        'The query returned no data',
      );
    });
    it('should render cached query', () => {
      const wrapper = shallow(<ResultSet {...cachedQueryProps} />);
      const cachedData = [{ col1: 'a', col2: 'b' }];
      wrapper.setState({ data: cachedData });
      const filterableTable = wrapper.find(FilterableTable);
      expect(filterableTable.props().data).toBe(cachedData);
    });
    it('should render stopped query', () => {
      const wrapper = shallow(<ResultSet {...stoppedQueryProps} />);
      expect(wrapper.find(Alert)).toExist();
    });
    it('should render running/pending/fetching query', () => {
      const wrapper = shallow(<ResultSet {...runningQueryProps} />);
      expect(wrapper.find(ProgressBar)).toExist();
    });
    it('should render a failed query with an error message', () => {
      const wrapper = shallow(
        <ResultSet {...failedQueryWithErrorMessageProps} />,
      );
      expect(wrapper.find(ErrorMessageWithStackTrace)).toExist();
    });
    it('should render a failed query with an errors object', () => {
      const wrapper = shallow(<ResultSet {...failedQueryWithErrorsProps} />);
      expect(wrapper.find(ErrorMessageWithStackTrace)).toExist();
    });
  });
});
