$body = '{"ingredients": ["chicken breast", "garlic", "spinach", "lemon", "rice"]}'
$response = Invoke-WebRequest -Uri "http://localhost:8000/generate-recipe" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content
