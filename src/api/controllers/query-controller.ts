// src/api/controllers/query-controller.ts
 import { Request, Response, NextFunction } from 'express';
 import { LLMService } from '../../services/llm-service';
 import logger from '../../utils/logger';
 import { ApplicationError } from '../../utils/errors';
 
 /**
  * Controller for LLM query endpoints
  */
 export class QueryController {
   constructor(private llmService: LLMService) {}
   
   /**
    * Send a query to the LLM
    */
   async query(req: Request, res: Response, next: NextFunction) {
     try {
       const { 
         query, 
         contextId, 
         projectId, 
         systemPrompt,
         provider,
         saveResponse,
         responseContextId,
         model,
         temperature,
         maxTokens,
         includedContentIds
       } = req.body;
       
       if (!query) {
         throw new ApplicationError('Query is required', 400);
       }
       
       if (!projectId) {
         throw new ApplicationError('Project ID is required', 400);
       }
       
       // Ensure user is authenticated
       if (!req.user) {
         throw new ApplicationError('User authentication required', 401);
       }
       
       const result = await this.llmService.query(query, {
         contextId,
         projectId,
         systemPrompt,
         providerName: provider,
         userId: req.user.id,
         saveResponse: saveResponse !== false, // Default to true
         responseContextId,
         includedContentIds,
         llmOptions: {
           model,
           temperature,
           maxTokens
         }
       });
       
       return res.json({
         response: result.response.content,
         contentItem: result.contentItem,
         metadata: {
           model: result.response.model,
           contentTokens: result.contentTokens,
           promptTokens: result.promptTokens,
           completionTokens: result.completionTokens,
           totalTokens: result.totalTokens,
           finishReason: result.response.finishReason
         }
       });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Stream a response from the LLM
    */
   async streamQuery(req: Request, res: Response, next: NextFunction) {
     try {
       const { 
         query, 
         contextId, 
         projectId, 
         systemPrompt,
         provider,
         saveResponse,
         responseContextId,
         model,
         temperature,
         maxTokens,
         includedContentIds
       } = req.body;
       
       if (!query) {
         throw new ApplicationError('Query is required', 400);
       }
       
       if (!projectId) {
         throw new ApplicationError('Project ID is required', 400);
       }
       
       // Ensure user is authenticated
       if (!req.user) {
         throw new ApplicationError('User authentication required', 401);
       }
       
       // Set up SSE headers
       res.setHeader('Content-Type', 'text/event-stream');
       res.setHeader('Cache-Control', 'no-cache');
       res.setHeader('Connection', 'keep-alive');
       
       // Function to send SSE events
       const sendEvent = (event: string, data: any) => {
         res.write(`event: ${event}\n`);
         res.write(`data: ${JSON.stringify(data)}\n\n`);
       };
       
       // Start the stream
       sendEvent('start', { message: 'Stream started' });
       
       // Stream the response
       await this.llmService.streamResponse(
         query,
         (chunk, done) => {
           // Send the chunk
           sendEvent('chunk', { content: chunk, done });
           
           // End the stream if done
           if (done) {
             sendEvent('end', { message: 'Stream ended' });
             res.end();
           }
         },
         {
           contextId,
           projectId,
           systemPrompt,
           providerName: provider,
           userId: req.user.id,
           saveResponse: saveResponse !== false, // Default to true
           responseContextId,
           includedContentIds,
           llmOptions: {
             model,
             temperature,
             maxTokens,
             stream: true
           }
         }
       );
     } catch (error: any) {
       logger.error('Error in stream query', { error: error.message });
       
       // Send error event and close the stream
       res.write(`event: error\n`);
       res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
       res.end();
     }
   }
   
   /**
    * Get available LLM providers and models
    */
   async getAvailableModels(req: Request, res: Response, next: NextFunction) {
     try {
       const { modelRegistry } = await import('../../llm/model-registry');
       
       // Get all providers and their models
       const providers = Array.from(modelRegistry.getAllConnectors().keys());
       const models = await modelRegistry.getAllAvailableModels();
       
       // Get the default provider
       let defaultProvider: string;
       try {
         defaultProvider = modelRegistry.getDefaultConnector().getProviderName();
       } catch (error) {
         defaultProvider = providers[0] || 'None';
       }
       
       return res.json({
         providers,
         models,
         defaultProvider
       });
     } catch (error) {
       next(error);
     }
   }
 }










//  // src/api/controllers/query-controller.ts
// import { Request, Response } from 'express';
// import { QueryService, QueryOptions } from '../../services/query-service';
// import { ApplicationError } from '../../utils/errors';
// import logger from '../../utils/logger';

// export class QueryController {
//   constructor(private queryService: QueryService) {}
  
//   /**
//    * Process a query
//    */
//   async processQuery(req: Request, res: Response): Promise<void> {
//     try {
//       const { query, contextId, options } = req.body;
      
//       // Validate input
//       if (!query) {
//         throw new ApplicationError('Query is required', 400);
//       }
      
//       if (!contextId) {
//         throw new ApplicationError('Context ID is required', 400);
//       }
      
//       // Check if streaming is requested
//       const queryOptions: QueryOptions = options || {};
      
//       if (queryOptions.stream) {
//         // Set up streaming response
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');
        
//         // Send a start event
//         res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
        
//         // Process streaming query
//         await this.queryService.streamQueryResponse(
//           query,
//           contextId,
//           (chunk) => {
//             res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
//           },
//           queryOptions
//         );
        
//         // Send an end event
//         res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
//         res.end();
//       } else {
//         // Process regular query
//         const response = await this.queryService.processQuery(
//           query,
//           contextId,
//           queryOptions
//         );
        
//         res.json(response);
//       }
//     } catch (error: any) {
//       this.handleError(error, res);
//     }
//   }
  
//   /**
//    * Get available models
//    */
//   getAvailableModels(req: Request, res: Response): void {
//     try {
//       // This would typically come from the model registry
//       // For now, we'll return a simple list
//       res.json([
//         {
//           id: 'gpt-3.5-turbo',
//           provider: 'openai',
//           maxContextTokens: 4096,
//           capabilities: ['text', 'code']
//         },
//         {
//           id: 'gpt-4',
//           provider: 'openai',
//           maxContextTokens: 8192,
//           capabilities: ['text', 'code', 'reasoning']
//         }
//       ]);
//     } catch (error: any) {
//       this.handleError(error, res);
//     }
//   }
  
//   /**
//    * Error handler helper
//    */
//   private handleError(error: any, res: Response): void {
//     if (error instanceof ApplicationError) {
//       res.status(error.statusCode).json({
//         error: error.message,
//         statusCode: error.statusCode
//       });
//       return;
//     }
    
//     logger.error('Query controller error', { error: error.message });
    
//     res.status(500).json({
//       error: 'An unexpected error occurred',
//       statusCode: 500
//     });
//   }
// }