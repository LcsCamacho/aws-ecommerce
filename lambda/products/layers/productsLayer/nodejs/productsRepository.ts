import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as generateUUID } from "uuid";

export interface Product {
  productId: string;
  productName: string;
  price: number;
  code: string;
  model: string;
}

export class ProductRepository {
  private client: DocumentClient;
  private tableName: string;

  constructor(client: DocumentClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  async getProducts(
    optionalParams?: DocumentClient.GetItemInput
  ): Promise<Product[]> {
    try {
      const params = {
        ...optionalParams,
        TableName: this.tableName,
      };

      const data = await this.client.scan(params).promise();
      return data.Items as Product[];
    } catch (error) {
      console.error("Error getting products", error);
      throw error;
    }
  }

  async getProductById(
    productId: string,
    optionalParams?: DocumentClient.GetItemInput
  ): Promise<Product> {
    try {
      const params: DocumentClient.GetItemInput = {
        ...optionalParams,
        TableName: this.tableName,
        Key: {
          productId,
        },
      };

      const data = await this.client.get(params).promise();
      return data.Item as Product;
    } catch (error) {
      console.error("Error getting product", error);
      throw error;
    }
  }

  async createProduct(
    product: Product,
    optionalParams?: DocumentClient.PutItemInput
  ): Promise<Product> {
    try {
      const params: DocumentClient.PutItemInput = {
        ...optionalParams,
        TableName: this.tableName,
        Item: product,
      };

      if (!product.productId) {
        product.productId = generateUUID();
      }

      await this.client.put(params).promise();
      return product;
    } catch (error) {
      console.error("Error creating product", error);
      throw error;
    }
  }

  async updateProduct(
    product: Product,
    optionalParams?: DocumentClient.UpdateItemInput
  ): Promise<Product> {
    try {
      const params: DocumentClient.UpdateItemInput = {
        ...optionalParams,
        TableName: this.tableName,
        Key: {
          productId: product.productId,
        },
        ConditionExpression: "attribute_exists(productId)",
        UpdateExpression:
          "set productName = :productName, price = :price, code = :code, model = :model",
        ExpressionAttributeValues: {
          ":productName": product.productName,
          ":price": product.price,
          ":code": product.code,
          ":model": product.model,
        },
        ReturnValues: "ALL_NEW",
      };

      const data = await this.client.update(params).promise();
      return data.Attributes as Product;
    } catch (error) {
      console.error("Error updating product", error);
      throw error;
    }
  }

  async deleteProduct(
    productId: string,
    optionalParams?: DocumentClient.DeleteItemInput
  ): Promise<Product> {
    try {
      const params: DocumentClient.DeleteItemInput = {
        ...optionalParams,
        TableName: this.tableName,
        Key: {
          productId,
        },
        ReturnValues: "ALL_OLD",
      };

      const data = await this.client.delete(params).promise();
      return data.Attributes as Product;
    } catch (error) {
      console.error("Error deleting product", error);
      throw error;
    }
  }
}
