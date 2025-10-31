import boto3
import os
import time
import urllib3
import json

http = urllib3.PoolManager()

def lambda_handler(event, context):
    """
    This function will create different objects in S3 buckets and then call the plotting API
    """

    # getting the bucket name from environment variables
    bucket_name = os.environ['BUCKET_NAME']

    # getting the plotting api
    plotting_api = os.environ['PLOTTING_API']

    # creating s3 client
    s3_client = boto3.client('s3')

    # adding objects in s3 bucket
    s3_client.put_object(
        Bucket=bucket_name,
        Key='assignment1.txt',
        Body='Empty Assignment 1'
    )
    print("Created assignment1.txt (19 bytes)")
    
    time.sleep(3)
    
    print("Step 2: Updating assignment1.txt")
    s3_client.put_object(
        Bucket=bucket_name,
        Key='assignment1.txt',
        Body='Empty Assignment 2222222222'
    )

    print("Updated assignment1.txt (28 bytes)")
    time.sleep(3)
    
    print("Step 3: Deleting assignment1.txt")
    s3_client.delete_object(
        Bucket=bucket_name,
        Key='assignment1.txt'
    )

    print("Deleted assignment1.txt")
    time.sleep(3)
    
    print("Step 4: Creating assignment2.txt")
    s3_client.put_object(
        Bucket=bucket_name,
        Key='assignment2.txt',
        Body='33'
    )

    print("Created assignment2.txt (2 bytes)")
    time.sleep(3)
    
    print("Step 5: Calling plotting API")
    try:
        response = http.request('GET', plotting_api)
        print(f"Plotting API status: {response.status}")
        print(f"Response: {response.data.decode('utf-8')}")
    except Exception as e:
        print(f"Error calling API: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Driver lambda completed successfully')
    }