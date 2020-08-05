const {
  SchemaDirectiveVisitor,
  AuthenticationError,
} = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const { formatDate } = require("./utils");

class FormatDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolver || defaultFieldResolver;
    const { format: defaultFormat } = this.args;
    field.args.push({
      name: "format",
      type: GraphQLString,
    });

    field.resolve = async (root, { format, ...rest }, ctx, info) => {
      const result = await resolver.call(this, root, rest, ctx, info);
      return formatDate(result, format || defaultFormat);
    };
    field.type = GraphQLString;
  }
}

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolver || defaultFieldResolver;
    field.resolve = (root, args, ctx, info) => {
      if (!ctx.user) {
        throw new AuthenticationError("Not authenticated");
      }
      return resolver(root, args, ctx, info);
    };
  }
}
class AuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolver || defaultFieldResolver;
    field.resolve = (root, args, ctx, info) => {
      if (ctx.user.role != this.args.role) {
        throw new AuthenticationError("Not authenticated");
      }
      return resolver(root, args, ctx, info);
    };
  }
}
module.exports = {
  FormatDateDirective,
  AuthenticationDirective,
  AuthorizationDirective,
};
