import boto3
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class AWSCostExplorer:
    def __init__(self):
        self.client = boto3.client(
            'ce',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-west-2')
        )

    def get_daily_costs(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        logger.info(f"Fetching AWS costs from {start_date} to {end_date}")

        try:
            response = self.client.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity='DAILY',
                Metrics=['UnblendedCost'],
                GroupBy=[
                    {'Type': 'TAG', 'Key': 'Team'},
                    {'Type': 'DIMENSION', 'Key': 'SERVICE'}
                ]
            )
            logger.info(f"Received response from AWS Cost Explorer: {response}")
        except Exception as e:
            logger.error(f"Error fetching costs from AWS: {str(e)}")
            raise

        costs = []
        for result in response.get('ResultsByTime', []):
            date = datetime.strptime(result['TimePeriod']['Start'], '%Y-%m-%d')
            logger.debug(f"Processing costs for date: {date}")

            for group in result.get('Groups', []):
                team_tag = next((tag['Value'] for tag in group['Keys'] if tag.startswith('Team$')), 'Unassigned')
                service = next((tag['Value'] for tag in group['Keys'] if not tag.startswith('Team$')), 'Unknown')

                amount = float(group['Metrics']['UnblendedCost']['Amount'])
                logger.debug(f"Found cost: Team={team_tag}, Service={service}, Amount={amount}")

                costs.append({
                    'date': date,
                    'team': team_tag,
                    'service': service,
                    'amount': amount
                })

        logger.info(f"Processed {len(costs)} cost records")
        return costs

    def get_month_to_date_costs(self) -> List[Dict[str, Any]]:
        today = datetime.now()
        first_day = today.replace(day=1)
        return self.get_daily_costs(first_day, today)

    def get_last_30_days_costs(self) -> List[Dict[str, Any]]:
        today = datetime.now()
        thirty_days_ago = today - timedelta(days=30)
        return self.get_daily_costs(thirty_days_ago, today)