import boto3
import time
import os

def lambda_handler(event, context):
    """
    This lambda handler is triggered by an S3 events: create/update/delete
    It calculates the total size of the bucket and write it to a dynamodb table
    """

    # creating s3 and dynamodb clients
    s3_client = boto3.client('s3')
    dynamodb_client = boto3.client('dynamodb')

    # bucket name
    bucket_name = event['Records'][0]['s3']['bucket']['name']

    # reading all the objects from the bucket and calculating its size
    object_count = 0
    total_size = 0

    response = s3_client.list_objects_v2(Bucket=bucket_name)

    # calculating the total size of buckets
    if 'Contents' in response:
        for obj in response['Contents']:
            object_count += 1
            total_size += obj['Size']
            print(f"Object {obj['Key']} has size {obj['Size']}")
        
        print(f"Total size of the bucket {bucket_name} is {total_size}")
    
    else:
        print(f'Bucket {bucket_name} is empty')

    current_timestamp = int(time.time() * 1000) # converting to mili seconds for better plot

    table_name = os.environ['TABLE_NAME']

    dynamodb_client.put_item(
        TableName = table_name,
        Item = {
            'bucket_name' : {'S' : bucket_name},
            'timestamp' : {'N' : str(current_timestamp)},
            'total_size' : {'N' : str(total_size)},
            'object_count' : {'N' : str(object_count)},
            'record_type' : {'S': 'bucket_object'} # added so that I can create an index with this as partition key
        })
    
    print(f"Successfully wrote to DynamoDB Table {table_name} - Bucket: {bucket_name}")





