import { Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

export function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Parse JSON body helper
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const apiKey = process.env.GEMINI_API_KEY;
            let parsedBody = {};
            if (body) {
              try {
                parsedBody = JSON.parse(body);
              } catch (e) {
                // ignore
              }
            }

            res.setHeader('Content-Type', 'application/json');

            // Route 1: Analyze Fridge / Pantry Image
            if (req.url === '/api/analyze-image' && req.method === 'POST') {
              const { imageBase64 } = parsedBody as { imageBase64?: string };

              if (!apiKey) {
                // Return default mock detection if API key not provided
                return res.end(
                  JSON.stringify({
                    success: true,
                    items: [
                      {
                        name: 'Haas Avocados',
                        category: 'Produce',
                        quantity: 2,
                        location: 'Countertop',
                        daysLeft: 2,
                        expiryText: 'Use within 2 days',
                        freshnessPercent: 25,
                        status: 'warning',
                        confidence: 96,
                      },
                      {
                        name: 'Roma Tomatoes',
                        category: 'Produce',
                        quantity: 6,
                        location: 'Crisper Drawer',
                        daysLeft: 5,
                        expiryText: 'Fresh (5+ days)',
                        freshnessPercent: 80,
                        status: 'fresh',
                        confidence: 95,
                      },
                      {
                        name: 'Fresh Basil',
                        category: 'Produce',
                        quantity: 1,
                        unit: 'Bunch',
                        location: 'Produce Drawer',
                        daysLeft: 1,
                        expiryText: 'Use within 1 day',
                        freshnessPercent: 15,
                        status: 'warning',
                        confidence: 92,
                      },
                      {
                        name: 'Milk',
                        category: 'Dairy',
                        quantity: 1,
                        unit: 'Carton',
                        location: 'Door Shelf',
                        daysLeft: 4,
                        expiryText: 'Fresh (4 days)',
                        freshnessPercent: 70,
                        status: 'fresh',
                        confidence: 90,
                      },
                    ],
                  })
                );
              }

              const ai = new GoogleGenAI({ apiKey });
              const prompt = `Analyze this fridge or pantry photo. Identify all food items visible with estimated quantities, category (Produce, Dairy, Pantry, Protein), estimated shelf life in days left, freshness percentage (0-100), and detection confidence percentage. Return strictly valid JSON array of objects with keys: name, category, quantity, unit, location, daysLeft, expiryText, freshnessPercent, status ('critical'|'warning'|'fresh'|'good'), confidence.`;

              const imagePart = imageBase64
                ? {
                    inlineData: {
                      data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                      mimeType: 'image/jpeg',
                    },
                  }
                : null;

              const contents = imagePart ? [prompt, imagePart] : [prompt];

              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents as any,
                config: {
                  responseMimeType: 'application/json',
                },
              });

              const text = response.text || '[]';
              const items = JSON.parse(text);

              return res.end(JSON.stringify({ success: true, items }));
            }

            // Route 2: Generate Smart Recipes
            if (req.url === '/api/generate-recipes' && req.method === 'POST') {
              const { ingredients, filter } = parsedBody as { ingredients?: string[]; filter?: string };

              if (!apiKey) {
                return res.end(
                  JSON.stringify({
                    success: true,
                    message: 'Using standard recipes (Configure GEMINI_API_KEY in Secrets for custom AI generation)',
                  })
                );
              }

              const ai = new GoogleGenAI({ apiKey });
              const prompt = `Given these pantry ingredients: ${JSON.stringify(
                ingredients || []
              )} and filter preference: "${filter || 'All'}", generate 3 creative, appetizing recipes. Format output as a JSON array of recipe objects with keys: title, author, prepTime, cookTime, prepMinutes, cookMinutes, level ('Easy'|'Medium'|'Hard'), calories, servings, matchPercentage, ingredients (array of {name, amount, unit, inPantry}), smartSubstitutions (array of {originalIngredient, substituteIngredient, reason, availableInPantry}), steps (array of {stepNumber, instruction, durationMinutes, tip}), tags.`;

              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                },
              });

              const recipes = JSON.parse(response.text || '[]');
              return res.end(JSON.stringify({ success: true, recipes }));
            }

            // Route 3: Smart Substitutions AI
            if (req.url === '/api/smart-swap' && req.method === 'POST') {
              const { missingIngredient, availablePantry } = parsedBody as {
                missingIngredient?: string;
                availablePantry?: string[];
              };

              if (!apiKey) {
                return res.end(
                  JSON.stringify({
                    success: true,
                    substitution: {
                      originalIngredient: missingIngredient || 'Heavy Cream',
                      substituteIngredient: 'Greek Yogurt',
                      reason: `Use Greek Yogurt from your pantry. It provides a rich creamy texture with less fat.`,
                      availableInPantry: true,
                    },
                  })
                );
              }

              const ai = new GoogleGenAI({ apiKey });
              const prompt = `The user needs a substitute for "${missingIngredient}". In their pantry they have: ${JSON.stringify(
                availablePantry || []
              )}. Suggest the single best culinary substitute available in their pantry or easy to swap. Return JSON object with keys: originalIngredient, substituteIngredient, reason, availableInPantry.`;

              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                },
              });

              const substitution = JSON.parse(response.text || '{}');
              return res.end(JSON.stringify({ success: true, substitution }));
            }

            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Endpoint not found' }));
          } catch (error: any) {
            console.error('API Error:', error);
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
          }
        });
      });
    },
  };
}
