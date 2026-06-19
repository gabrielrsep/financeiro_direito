
export default defineEventHandler(async (event) => {
  const success = await clearUserSession(event)
  
  return {
    success
  };
});
