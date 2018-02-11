jest.mock('isomorphic-fetch');
const fetch = require('isomorphic-fetch');
const { sourceNodes } = require('../gatsby-node');

const createNode = jest.fn();
const boundActionCreators = { createNode };
const done = jest.fn();
const pluginOptions = {
  endpoint: 'http://mozaik.endpoint',
  accessToken: 'authorization-access-token',
  query: 'graphql query',
  fragments: ['fragment 1', 'fragment 2'],
  variables: {
    types: ['TYPE'],
    pageSize: 10,
    page: 1
  }
};

describe('sourceNodes function', () => {
  it('fetches the data', async () => {
    fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          json() {
            return Promise.resolve({
              data: {
                documents: {
                  pagination: {
                    page: 1,
                    pageCount: 2
                  },
                  items: [
                    {
                      id: 'document-id-1',
                      contentType: 'POST',
                      field: 'field',
                      field2: 'field2'
                    }
                  ]
                }
              }
            });
          }
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json() {
            return Promise.resolve({
              data: {
                documents: {
                  pagination: {
                    page: 2,
                    pageCount: 2
                  },
                  items: [
                    {
                      id: 'document-id-2',
                      contentType: 'POST',
                      field: 'field',
                      field2: 'field2'
                    }
                  ]
                }
              }
            });
          }
        })
      );

    await sourceNodes({ boundActionCreators }, pluginOptions, done);

    expect(fetch).toHaveBeenCalledWith(pluginOptions.endpoint, {
      body:
        '{"query":"graphql query\\nfragment 1\\nfragment 2","variables":{"types":["TYPE"],"pageSize":10,"page":1}}',
      headers: {
        Authorization: 'Bearer authorization-access-token',
        'content-type': 'application/json'
      },
      method: 'post'
    });

    expect(createNode).toHaveBeenCalledWith({
      children: [],
      contentType: 'POST',
      field: 'field',
      field2: 'field2',
      id: 'document-id-1',
      internal: {
        content:
          '{"id":"document-id-1","contentType":"POST","field":"field","field2":"field2"}',
        contentDigest: 'c45da7e9d48ce15b2ddee36278fa51c0',
        type: 'Post'
      },
      parent: null
    });
    expect(createNode).toHaveBeenCalledWith({
      children: [],
      contentType: 'POST',
      field: 'field',
      field2: 'field2',
      id: 'document-id-2',
      internal: {
        content:
          '{"id":"document-id-2","contentType":"POST","field":"field","field2":"field2"}',
        contentDigest: 'c9b4b32aa27a05a2b130ac2867adbd34',
        type: 'Post'
      },
      parent: null
    });
  });

  it('throws an error if contentType field is not part of the query', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        json() {
          return Promise.resolve({
            data: {
              documents: {
                pagination: {
                  page: 1,
                  pageCount: 1
                },
                items: [
                  {
                    id: 'document-id-1',
                    field: 'field',
                    field2: 'field2'
                  }
                ]
              }
            }
          });
        }
      })
    );

    try {
      await sourceNodes({ boundActionCreators }, pluginOptions, done);
    } catch (e) {
      expect(e.message).toEqual(
        '"contentType" field must be present on every document in the query!'
      );
    }
  });
});
