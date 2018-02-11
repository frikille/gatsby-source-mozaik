const crypto = require('crypto');
const fetch = require('isomorphic-fetch');

async function fetchData(pluginOptions) {
  const { endpoint, accessToken, query, fragments, variables } = pluginOptions;

  const response = await fetch(endpoint, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      query: `${query}\n${fragments.join('\n')}`,
      variables
    })
  });
  const graphqlResponse = await response.json();
  const documents = graphqlResponse.data.documents;

  if (documents.pagination.page < documents.pagination.pageCount) {
    const additionalItems = await fetchData({
      ...pluginOptions,
      variables: {
        ...variables,
        page: documents.pagination.page + 1
      }
    });

    return [...documents.items, ...additionalItems];
  }

  return documents.items;
}

exports.sourceNodes = async ({ boundActionCreators }, pluginOptions, done) => {
  const { createNode } = boundActionCreators;

  const documents = await fetchData(pluginOptions);

  // Process data into nodes.
  documents.forEach(doc => {
    const jsonNode = JSON.stringify(doc);
    const { id, contentType, ...fields } = doc;

    if (!contentType) {
      throw new Error(
        '"contentType" field must be present on every document in the query!'
      );
    }

    createNode({
      id,
      contentType,
      ...fields,
      children: [],
      parent: null,
      internal: {
        type: `${contentType.substring(
          0,
          1
        )}${contentType.toLowerCase().substring(1)}`,
        content: jsonNode,
        contentDigest: crypto
          .createHash(`md5`)
          .update(jsonNode)
          .digest(`hex`)
      }
    });
  });

  // We're done, return.
  done();
  return;
};
