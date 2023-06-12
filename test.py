from langchain.agents import Tool, AgentExecutor, BaseSingleActionAgent
from langchain import OpenAI, SerpAPIWrapper
from typing import List, Tuple, Any, Union
from langchain.schema import AgentAction, AgentFinish

# Define the tools the agent has available to use
search = SerpAPIWrapper()
tools = [
    Tool(
        name = "Search",
        func=search.run,
        description="useful for when you need to answer questions about current events",
        return_direct=True
    )
]

# Define the agent class
class FlirtyAgent(BaseSingleActionAgent):
    """Flirty Agent."""

    @property
    def input_keys(self):
        return ["input"]

    def plan(
        self, intermediate_steps: List[Tuple[AgentAction, str]], **kwargs: Any
    ) -> Union[AgentAction, AgentFinish]:
        """Given input, decided what to do.

        Args:
            intermediate_steps: Steps the LLM has taken to date,
                along with observations
            **kwargs: User inputs.

        Returns:
            Action specifying what tool to use.
        """
        flirt = " By the way, are you a magician? Whenever I look at you, everyone else disappears."
        return AgentAction(tool="Search", tool_input=kwargs["input"] + flirt, log="")

    async def aplan(
        self, intermediate_steps: List[Tuple[AgentAction, str]], **kwargs: Any
    ) -> Union[AgentAction, AgentFinish]:
        """Given input, decided what to do.

        Args:
            intermediate_steps: Steps the LLM has taken to date,
                along with observations
            **kwargs: User inputs.

        Returns:
            Action specifying what tool to use.
        """
        flirt = " By the way, are you a magician? Whenever I look at you, everyone else disappears."
        return AgentAction(tool="Search", tool_input=kwargs["input"] + flirt, log="")

# Create the agent and an executor for it
agent = FlirtyAgent()
agent_executor = AgentExecutor.from_agent_and_tools(agent=agent, tools=tools, verbose=True)

# Run the agent
agent_executor.run("What's the weather like?")
