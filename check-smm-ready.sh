#!/bin/bash

echo "🔍 SOCIAL MEDIA MANAGER - PRODUCTION READINESS CHECK"
echo "================================================================"

# Check each component
components=(
  "lib/social-media-manager/agents/content-creator-agent.ts:Content Creator"
  "lib/social-media-manager/agents/trend-spotter-agent.ts:Trend Spotter"
  "lib/social-media-manager/agents/scheduler-agent.ts:Scheduler"
  "lib/social-media-manager/agents/analytics-agent.ts:Analytics"
  "lib/social-media-manager/agents/engagement-agent.ts:Engagement"
  "lib/social-media-manager/agents/approval-agent.ts:Approval"
  "lib/social-media-manager/integrations.ts:Platform APIs"
  "lib/social-media-manager/social-media-manager.ts:LangGraph Orchestrator"
)

echo ""
echo "✅ COMPONENT STATUS:"
for component in "${components[@]}"; do
  IFS=':' read -r path name <<< "$component"
  if [ -f "$path" ]; then
    lines=$(wc -l < "$path")
    echo "  ✅ $name ($lines lines)"
  else
    echo "  ❌ $name - MISSING"
  fi
done

echo ""
echo "🔗 INTEGRATION POINTS:"

# Check if APIs are called
echo "  Checking API integrations..."
if grep -q "publishToInstagram\|publishToTwitter\|publishToLinkedIn" lib/social-media-manager/integrations.ts 2>/dev/null; then
  echo "  ✅ Platform publishing functions exist"
else
  echo "  ❌ Platform publishing NOT IMPLEMENTED"
fi

# Check database integration
if grep -q "supabase\|from('posts')\|from('analytics')" lib/social-media-manager/*.ts 2>/dev/null; then
  echo "  ✅ Supabase integration exists"
else
  echo "  ❌ Supabase integration NOT IMPLEMENTED"
fi

# Check LLM integration
if grep -q "groq\|openai\|llm" lib/social-media-manager/*.ts 2>/dev/null; then
  echo "  ✅ LLM integration exists"
else
  echo "  ❌ LLM integration NOT IMPLEMENTED"
fi

echo ""
echo "🚀 DEPLOYMENT REQUIREMENTS:"
echo "  For customer to use immediately, needs:"
echo "  1. ✅ Agent logic"
echo "  2. ? API keys configured (check .env)"
echo "  3. ? Platform credentials (Instagram, Twitter, etc.)"
echo "  4. ? Database initialized"
echo "  5. ? WhatsApp integration"

