defmodule UcxChat.FlexBarService do
  import Ecto.Query

  alias UcxChat.{Repo, FlexBarView, Channel, Client, User}
  alias UcxChat.ServiceHelpers, as: Helpers

  require Logger

  def handle_in("Info", %{"channel_id" => channel_id} = msg)  do

    channel = Helpers.get_channel(channel_id)

    html = FlexBarView.render(msg["templ"], channel: channel)
    |> Phoenix.HTML.safe_to_string
    {:ok, %{html: html}}
  end
  def handle_in("Members List", %{"channel_id" => channel_id} = msg)  do
    channel = Helpers.get_channel(channel_id, [:clients])

    {client, user_mode} = case msg["nickname"] do
      nil -> {Helpers.get(Client, msg["client_id"]), false}
      nickname -> {Helpers.get_by(Client, :nickname, nickname), true}
    end
    # Logger.warn "FlexBarService client: #{inspect client}, msg: #{inspect msg}"

    html = FlexBarView.render(msg["templ"], clients: channel.clients, client: client, user_mode: user_mode)
    |> Phoenix.HTML.safe_to_string
    {:ok, %{html: html}}
  end
  def handle_in("Switch User", msg) do
    Logger.warn "FlexBarService.handle_in: #{inspect msg}"
    users = Repo.all User

    html = FlexBarView.render(msg["templ"], users: users)
    |> Phoenix.HTML.safe_to_string
    {:ok, %{html: html}}
  end
end
