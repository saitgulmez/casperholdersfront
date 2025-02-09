<template>
  <v-stepper
    v-model="e1"
    class="transparent"
  >
    <v-stepper-header>
      <v-stepper-step
        :complete="e1 > 1"
        step="1"
      >
        Select contract
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 2"
        step="2"
      >
        Select entrypoint
      </v-stepper-step>

      <v-divider />

      <v-stepper-step step="3">
        Send deploy
      </v-stepper-step>
    </v-stepper-header>

    <v-stepper-items>
      <v-stepper-content step="1">
        <v-card>
          <v-autocomplete
            v-model="selectedSearchContract"
            :items="foundContracts"
            :loading="loadingContracts"
            :search-input.sync="searchContract"
            color="white"
            hide-no-data
            hide-selected
            item-text="hash"
            item-value="hash"
            label="Contracts"
            placeholder="Start typing to Search"
            prepend-icon="mdi-database-search"
            return-object
          />
          <v-list>
            <v-subheader>Account Contracts</v-subheader>
            <v-list-item-group v-model="selectedContract">
              <v-list-item
                v-for="(contract, i) in contracts"
                :key="i"
                @click="e1 = 2; selectedContract = i;"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    {{ getContractName(contract) }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Type: {{ contract.type }} Score: {{ contract.score.toFixed(0) }}%
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-stepper-content>

      <v-stepper-content step="2">
        <template v-if="selectedContract !== undefined">
          <v-card class="mb-5">
            <v-list>
              <v-list-item-group v-model="selectedEntrypoint">
                <v-list-item
                  v-for="(entrypoint, i) in contracts[selectedContract].data.Contract.entry_points"
                  :key="i"
                  @click="e1 = 3; selectedEntrypoint = i;"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ capitalizeFirstLetter(entrypoint.name) }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Access: {{ entrypoint.access }} Type: {{ entrypoint.entry_point_type }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
          <v-btn
            text
            @click="e1 = 1; selectedContract = undefined;"
          >
            Cancel
          </v-btn>
        </template>
        <template v-if="selectedSearchContract !== undefined">
          <v-card class="mb-5">
            <v-list>
              <v-list-item-group v-model="selectedEntrypoint">
                <v-list-item
                  v-for="(entrypoint, i) in selectedSearchContract.data.Contract.entry_points"
                  :key="i"
                  @click="e1 = 3; selectedEntrypoint = i;"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ capitalizeFirstLetter(entrypoint.name) }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Access: {{ entrypoint.access }} Type: {{ entrypoint.entry_point_type }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
          <v-btn
            text
            @click="e1 = 1; selectedSearchContract = undefined;"
          >
            Cancel
          </v-btn>
        </template>
      </v-stepper-content>

      <v-stepper-content step="3">
        <v-card
          class="mb-5"
        >
          <generic-deploy-operation
            v-if="selectedContract !== undefined && selectedEntrypoint !== undefined"
            :contract-hash="contracts[selectedContract].hash"
            :entrypoint="
              contracts[selectedContract].data.Contract.entry_points[selectedEntrypoint].name"
            :args="contracts[selectedContract].data.Contract.entry_points[selectedEntrypoint].args"
          />
          <generic-deploy-operation
            v-if="selectedSearchContract !== undefined && selectedEntrypoint !== undefined"
            :contract-hash="selectedSearchContract.hash"
            :entrypoint="
              selectedSearchContract.data.Contract.entry_points[selectedEntrypoint].name"
            :args="selectedSearchContract.data.Contract.entry_points[selectedEntrypoint].args"
          />
        </v-card>
        <v-btn
          text
          @click="e1 = 2; selectedEntrypoint = undefined;"
        >
          Cancel
        </v-btn>
      </v-stepper-content>
    </v-stepper-items>
  </v-stepper>
</template>

<script>
import GenericDeployOperation from '@/components/smartcontract/GenericDeployOperation';
import clientCasper from '@/helpers/clientCasper';
import { DATA_API } from '@/helpers/env';
import { CLPublicKey } from 'casper-js-sdk';
import { mapGetters } from 'vuex';

export default {
  name: 'ManageStepper',
  components: { GenericDeployOperation },
  data() {
    return {
      e1: 1,
      contracts: [],
      selectedContract: undefined,
      selectedEntrypoint: undefined,
      selectedSearchContract: undefined,
      foundContracts: [],
      loadingContracts: false,
      searchContract: null,
    };
  },
  computed: {
    ...mapGetters([
      'activeKey',
    ]),
  },
  watch: {
    async searchContract(val) {
      this.isLoading = true;
      const query = new URLSearchParams();

      query.set('hash', `ilike.*${val}*`);
      // Lazily load input items
      this.foundContracts = await (await fetch(`${DATA_API}/contracts?${query.toString()}&limit=10`)).json();

      this.isLoading = false;
    },
    selectedSearchContract(val) {
      console.log(val);
      if (val) {
        this.e1 = 2;
      }
    },
  },
  async mounted() {
    await this.getAccountContracts();
  },
  methods: {
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).replaceAll('_', ' ');
    },
    getContractName(contract) {
      const name = contract.named_keys.filter((n) => n.name.includes('name'))[0]?.initial_value;
      return name || contract.hash;
    },
    /**
     * Get account contracts
     */
    async getAccountContracts() {
      const srh = await clientCasper.casperRPC.getStateRootHash();
      const account = await clientCasper.casperRPC.getBlockState(
        srh,
        CLPublicKey.fromHex(this.activeKey).toAccountHashStr(),
        [],
      );
      const query = new URLSearchParams();
      const keys = account.Account.namedKeys.filter((n) => n.key.includes('hash-'));
      query.set('hash', `in.(${keys.map((n) => `"${n.key.replace('hash-', '')}"`).join(',')})`);
      query.set('select', '*,named_keys(*)');
      this.contracts = await (await fetch(`${DATA_API}/contracts?${query.toString()}`)).json();
    },
  },
};
</script>
