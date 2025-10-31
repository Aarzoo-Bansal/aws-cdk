import boto3
import os
import time
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend (required for Lambda!)
import matplotlib.pyplot as plt
import io

def lambda_handler(event, context):
    """
    This lambda handler is used to plot graph
    """

    # creating the s3 and dynamodb clients
    s3_client = boto3.client('s3')
    dynamodb_client = boto3.client('dynamodb')

    # Querying the bucket to get the data for the last 10 seconds
    current_time = int(time.time() * 1000)  # converting to miliseconds
    ten_seconds_ago = current_time - 10000 

    # getting the bucket name from environment variables
    s3_bucket_name = os.environ['BUCKET_NAME']

    # getting the table name from environment variables
    table_name = os.environ['TABLE_NAME']

    # getting the Index name from environment variables
    index_name = os.environ['INDEX_NAME']

    # query the table with this bucket name to get all the records that are 10 seconds old
    response = dynamodb_client.query(
        TableName=table_name,
        KeyConditionExpression='bucket_name = :bucket AND #ts >= :time_threshold',
        ExpressionAttributeNames={
            '#ts': 'timestamp'
        },
        ExpressionAttributeValues={
            ':bucket' : {'S': s3_bucket_name},
            ':time_threshold' : {'N': str(ten_seconds_ago)}
        })
    
    # Extracting data for plotting
    timestamps = []
    sizes = []

    for item in response['Items']:
        timestamps.append(int(item['timestamp']['N']))
        sizes.append(int(item['total_size']['N']))

    # Querying the index to get the maximum size
    index_response = dynamodb_client.query(
        TableName=table_name,
        IndexName=index_name,
        KeyConditionExpression='record_type = :rt',
        ExpressionAttributeValues={
            ':rt' : {'S' : 'bucket_object'}
        },
        ScanIndexForward = False,
        Limit = 1
    )

    if index_response['Items']:
        max_size = int(index_response['Items'][0]['total_size']['N'])
    else:
        max_size = 0 

    # Plotting the graph

        # Create figure and plot
    plt.figure(figsize=(10, 6))

    # Plot bucket size over last 10 seconds
    plt.plot(timestamps, sizes, marker='o', label='Bucket Size (Last 10 seconds)')

    # Plot horizontal line for max size
    plt.axhline(y=max_size, color='r', linestyle='--', label=f'Max Size Ever: {max_size} bytes')

    # Labels and title
    plt.xlabel('Timestamp (milliseconds)')
    plt.ylabel('Size (bytes)')
    plt.title('S3 Bucket Size Over Time')
    plt.legend()
    plt.grid(True)

    # Save plot to memory buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)

    # Upload to S3
    s3_client.put_object(
        Bucket=s3_bucket_name,
        Key='plot',
        Body=buffer,
        ContentType='image/png'
    )

    print(f"Plot uploaded successfully to {s3_bucket_name}/plot")

    return {
        'statusCode': 200,
        'body': 'Plot generated and saved to S3'
    }






