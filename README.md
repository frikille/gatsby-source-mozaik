# gatsby-source-mozaik

Source plugin for pulling data from a Mozaik endpoint into GatsbyJs.

## Install
1. `yarn add gatsby-source-mozaik` or `npm i gatsby-source-mozaik`
1. Add reference in your Gatsby config plugins section to `gatsby-source-mozaik`. See example below.
1. Run `gatsby develop`

## Usage

Make sure that `gatsby-source-mozaik` plugin is referenced in you `gatsby-config.js`:

```javascript
plugins: [
  {
    resolve: `gatsby-source-mozaik`,
    options: {
      endpoint: `https://api.mozaik.io/[your-project-name]`,
      accessToken: `your-access-token`,
      query: `
        query documentsQuery($types: [DocumentContentTypeEnum] $pageSize: Int $page: Int) {
          documents(types: $types pageSize: $pageSize page: $page) {
            pagination {
              page
              pageCount
            }
            items {
              id
              contentType
              slug
            }
          }
        }
      `,
      variables: {
        types: [],
        pageSize: 20,
        page: 1
      },
      fragments: []
    },
  }
],
```

### Plugin options
| Key      | Value    | Required |
| -------- | -------- | -------- |
| endpoint | Your mozaik api endpoint: `https://api.mozaik.io/[your-project-name]` | Yes |
| accessToken | The access token for authorizing against the api | Yes |
| query | The graphql query to execute. You should use the sample documents query and only amend it. | Yes |
| variables | Variables to use in the graphql query | Yes |
| variables.types | An array of string that defines the content types you want to get from the api | Yes |
| variables.pageSize | Number of items to download in one batch | Yes |
| variables.page | The page number | Yes |
| fragments | An array of string that defines the fields you want to query on each content type | No |

## How to write a query

Let's say you have created a blog project using the sample blog template on Mozaik. You will have 3 different content types (the enum name in your GraphQL schema):
* Homepage (HOMEPAGE)
* Post (POST)
* Author (AUTHOR)

And you only implement the homepage and the post page components.

To create the query you have to add the following plugin options:

1. Variables
```javascript
variables: {
  types: ['HOMEPAGE', 'POST'],
  page: 1,
  pageSize: 20
}
```
1. Query and Fragments

  In Mozaik each document implements the `DocumentInterface` type, and because of this the result of the `documents` query returns an array of `DocumentInterface` object. To be able to query specific fields on each document, you have to define a `fragment` for each content type. Although you can do this by inlining the fragments in the query itself, we highly recommend to add every fragment in the `fragments` plugin option in you config. You can read more about interfaces and fragments in the [GraphQL documentation](http://graphql.org/learn/schema/#interfaces)

  First let's add the fragment definitions:
  ```javascript
  fragments: [
    `fragment HomepageDetails on HomepageDocument {
      title
      tagline
      headerImage {
        ...HeaderImageFragment
      }
      topPosts {
        items {
          ...PostDetails
        }
      }
    }`
    `fragment PostDetails on PostDocument {
      title
      slug
      date
      postContent {
        html
      }
      postAuthor {
        name
      }
      headerImage {
        ...HeaderImageFragment
      }
    }`,
    `fragment HeaderImageFragment on Asset {
      url
      thumbnailUrl
      caption
    }`
  ]
  ```

  Update the default query to add the fragments above:
  ```graphql
  query documentsQuery($types: [DocumentContentTypeEnum] $pageSize: Int $page: Int) {
    documents(types: $types pageSize: $pageSize page: $page) {
      pagination {
        page
        pageCount
      }
      items {
        id
        contentType
        slug
        ...PostDetails
        ...HomepageDetails
      }
    }
  }
  ```

And that's it! You're ready to run `gatsby develop` and load all your documents. If you open the graphql ide that comes with Gatsby you can query your Post documents by running the `allPosts` query (or the `allHomepage` query for the Homepage document).


## Contributing

1. `cd` to the Gatsby project you've set up in which you want to test your changes of the plugin code, or clone [`mozaikio/mozaik-gatsby-example`](https://github.com/mozaikio/mozaik-gatsby-example)
1. If you cloned the example or previously installed the plugin through `yarn` or `npm`, run `yarn remove gatsby-source-mozaik` or `npm r gatsby-source-mozaik`
1. `mkdir plugins` if it does not exist in your Gatsby project yet and `cd` into it
1. The path should now be something like `~/projects/mozaik-gatsby-website/plugins/`
1. run `git clone https://github.com/mozaikio/gatsby-source-mozaik.git`
1. `cd gatsby-source-mozaik`
1. run `yarn` or `yarn && yarn watch` in `gatsby-source-mozaik` plugin’s directory for auto-rebuilding the plugin after you make changes to it (you need to do this only during development)
1. Make sure plugin is referenced in your Gatsby config (see above at Usage)
1. From there you can cd ../.. && yarn && yarn develop to test
